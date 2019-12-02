/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Record
 */

import { AccountActions, AccountController, ApplicationController, IAccountModel, IApplicationModel, validateAccountAction } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { Safe, SafeExtract } from "@sudoo/extract";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createGreenAuthHandler } from "../../../handlers/handlers";
import { autoHook } from "../../../handlers/hook";
import { ERROR_CODE, panic } from "../../../util/error";
import { BrontosaurusRoute } from "../../basic";

export type AccountHistoryRecordRouteBody = {

    readonly target: string;
    readonly type: keyof AccountActions;
    readonly application: string;
    readonly by: string;

    readonly content: string;
};

export class AccountHistoryRecordRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/history/record';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._accountHistoryRecordHandler.bind(this), 'Account History Record', true),
    ];

    private async _accountHistoryRecordHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: SafeExtract<AccountHistoryRecordRouteBody> = Safe.extract(req.body as AccountHistoryRecordRouteBody, this._error(ERROR_CODE.INSUFFICIENT_INFORMATION));

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const target: string = body.directEnsure('target');
            const type: keyof AccountActions = body.directEnsure('type');
            const application: string = body.directEnsure('application');
            const content: string = body.directEnsure('content');

            const by: string = body.directEnsure('by');

            if (!validateAccountAction(type)) {
                throw panic.code(ERROR_CODE.INVALID_ACCOUNT_ACTION, type);
            }

            const account: IAccountModel | null = await AccountController.getAccountByUsername(target);

            if (!account) {
                throw this._error(ERROR_CODE.ACCOUNT_NOT_FOUND, target);
            }

            const self: IAccountModel | null = await AccountController.getAccountByUsername(by);

            if (!self) {
                throw this._error(ERROR_CODE.ACCOUNT_NOT_FOUND, by);
            }

            const actionApplication: IApplicationModel | null = await ApplicationController.getApplicationByKey(application);

            if (!actionApplication) {
                throw this._error(ERROR_CODE.APPLICATION_NOT_FOUND, application);
            }

            account.pushHistory(type, account._id, self._id, content, undefined);

            await account.save();

            res.agent.add('account', account.id);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
