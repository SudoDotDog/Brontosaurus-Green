/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Record
 */

import { AccountActions, AccountController, IAccountModel, validateAccountAction } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { Safe, SafeExtract } from "@sudoo/extract";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createGreenAuthHandler } from "../../../handlers/handlers";
import { autoHook } from "../../../handlers/hook";
import { createRandomTempPassword } from "../../../util/auth";
import { ERROR_CODE, panic } from "../../../util/error";
import { BrontosaurusRoute } from "../../basic";

export type AccountHistoryRecordRouteBody = {

    readonly target: string;
    readonly type: keyof AccountActions;
    readonly application: string;
    readonly by: string;

    readonly content?: string;
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

            const account: IAccountModel | null = await AccountController.getAccountByUsername(target);

            if (!account) {
                throw this._error(ERROR_CODE.ACCOUNT_NOT_FOUND, target);
            }

            if (!validateAccountAction(type)) {
                throw panic.code(ERROR_CODE.INVALID_ACCOUNT_ACTION, type);
            }

            account.pushHistory()

            const tempPassword: string = createRandomTempPassword();
            account.limbo = true;
            account.setPassword(tempPassword);
            account.resetAttempt();

            await account.save();

            res.agent.add('limbo', Boolean(account.limbo));
            res.agent.add('tempPassword', tempPassword);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
