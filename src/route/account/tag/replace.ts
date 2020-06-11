/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account_Tag
 * @description Replace
 */

import { IAccountModel, ITagModel, MatchController, TagController } from "@brontosaurus/db";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { fillStringedResult, Pattern, StringedResult } from "@sudoo/verify";
import { createGreenAuthHandler } from "../../../handlers/handlers";
import { autoHook } from "../../../handlers/hook";
import { ERROR_CODE, panic } from "../../../util/error";
import { BrontosaurusRoute } from "../../basic";

const bodyPattern: Pattern = {
    type: 'map',
    strict: true,
    map: {
        username: { type: 'string' },
        namespace: { type: 'string' },
        tags: {
            type: 'list',
            element: { type: 'string' },
        },
    },
};

export type ReplaceAccountTagBody = {

    readonly username: string;
    readonly namespace: string;
    readonly tags: string[];
};

export class ReplaceAccountTagRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/tag/replace';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._replaceAccountTagHandler.bind(this), 'Replace Tag'),
    ];

    private async _replaceAccountTagHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: ReplaceAccountTagBody = req.body;

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

            const tags: ITagModel[] | null = await this._getTags(body.tags);

            if (!tags) {
                throw panic.code(ERROR_CODE.TAG_NOT_FOUND, 'multiple');
            }

            account.tags = tags.map((each: ITagModel) => each._id);

            await account.save();
            res.agent.add('tags', body.tags);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private async _getTags(tags: string[]): Promise<ITagModel[] | null> {

        const result: ITagModel[] = [];
        for (const tag of tags) {

            const instance: ITagModel | null = await TagController.getTagByName(tag);

            if (!instance) {
                return null;
            }

            result.push(instance);
        }

        return result;
    }
}
