/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Verify
 */

import { AccountController, IAccount } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export class VerifyAccountRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/verify/:account';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.GET;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._verifyAccountHandler.bind(this), 'Verify Account'),
    ];

    private async _verifyAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const accountName: string | undefined = req.params.account;

            if (!accountName) {
                throw panic.code(ERROR_CODE.INSUFFICIENT_INFORMATION, 'account');
            }

            const account: IAccount | null = await AccountController.getActiveAccountByUsernameLean(accountName);

            res.agent.add('valid', Boolean(account));

            if (account) {
                res.agent.add('account', {
                    username: account.username,
                    displayName: account.displayName,
                });
            }
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
