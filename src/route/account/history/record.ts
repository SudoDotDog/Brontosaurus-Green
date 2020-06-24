/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account_History
 * @description Record
 */

import { AccountActions, ApplicationController, IAccountModel, IApplicationModel, MatchController, validateAccountAction } from "@brontosaurus/db";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createStrictMapPattern, createStringPattern, Pattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { createGreenAuthHandler } from "../../../handlers/handlers";
import { autoHook } from "../../../handlers/hook";
import { ERROR_CODE, panic } from "../../../util/error";
import { BrontosaurusRoute } from "../../basic";

const bodyPattern: Pattern = createStrictMapPattern({

    username: createStringPattern(),
    namespace: createStringPattern(),

    type: createStringPattern({
        enum: ['CREATE', 'RESET_PASSWORD', 'UPDATE_CONTACT', 'UPDATE_GROUP'],
    }),
    byUsername: createStringPattern(),
    byNamespace: createStringPattern(),
    application: createStringPattern(),
    content: createStringPattern(),
});

export type AccountHistoryRecordRouteBody = {

    readonly username: string;
    readonly namespace: string;

    readonly type: keyof AccountActions;
    readonly byUsername: string;
    readonly byNamespace: string;
    readonly application: string;
    readonly content: string;
};

export class AccountHistoryRecordRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/history/record';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._accountHistoryRecordHandler.bind(this), 'Account History Record'),
    ];

    private async _accountHistoryRecordHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: AccountHistoryRecordRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            if (!validateAccountAction(body.type)) {
                throw panic.code(ERROR_CODE.INVALID_ACCOUNT_ACTION, body.type);
            }

            const account: IAccountModel | null = await MatchController.getAccountByUsernameAndNamespaceName(body.username, body.namespace);

            if (!account) {
                throw this._error(ERROR_CODE.ACCOUNT_NOT_FOUND, body.username);
            }

            const self: IAccountModel | null = await MatchController.getAccountByUsernameAndNamespaceName(body.byUsername, body.byNamespace);

            if (!self) {
                throw this._error(ERROR_CODE.ACCOUNT_NOT_FOUND, body.byUsername);
            }

            const actionApplication: IApplicationModel | null = await ApplicationController.getApplicationByKey(body.application);

            if (!actionApplication) {
                throw this._error(ERROR_CODE.APPLICATION_NOT_FOUND, body.application);
            }

            account.pushHistory(body.type, account._id, self._id, body.content, undefined);

            await account.save();

            res.agent.add('account', account.id);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
