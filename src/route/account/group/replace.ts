/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account_Group
 * @description Replace
 */

import { GroupController, IAccountModel, IGroupModel, MatchController } from "@brontosaurus/db";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createListPattern, createStrictMapPattern, createStringPattern, Pattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { createGreenAuthHandler } from "../../../handlers/handlers";
import { autoHook } from "../../../handlers/hook";
import { ERROR_CODE, panic } from "../../../util/error";
import { BrontosaurusRoute } from "../../basic";

const bodyPattern: Pattern = createStrictMapPattern({

    username: createStringPattern(),
    namespace: createStringPattern(),
    groups: createListPattern(createStringPattern()),
});

export type ReplaceAccountGroupBody = {

    readonly username: string;
    readonly namespace: string;
    readonly groups: string[];
};

export class ReplaceAccountGroupRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/group/replace';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._replaceAccountGroupHandler.bind(this), 'Replace Group'),
    ];

    private async _replaceAccountGroupHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: ReplaceAccountGroupBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            const account: IAccountModel | null = await MatchController.getAccountByUsernameAndNamespaceName(body.username, body.namespace);

            if (!account) {
                throw panic.code(ERROR_CODE.ACCOUNT_NOT_FOUND, body.username);
            }

            const groups: IGroupModel[] | null = await this._getGroups(body.groups);

            if (!groups) {
                throw panic.code(ERROR_CODE.GROUP_NOT_FOUND, 'multiple');
            }

            account.groups = groups.map((each: IGroupModel) => each._id);

            await account.save();
            res.agent.add('groups', body.groups);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private async _getGroups(groups: string[]): Promise<IGroupModel[] | null> {

        const result: IGroupModel[] = [];
        for (const group of groups) {

            const instance: IGroupModel | null = await GroupController.getGroupByName(group);

            if (!instance) {
                return null;
            }

            result.push(instance);
        }

        return result;
    }
}
