/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Detail
 */

import { AccountController, IAccountModel } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

// TODO: ADD Namespace
export class AccountDetailRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/detail/:username';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.GET;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._detailHandler.bind(this), 'Account Detail'),
    ];

    private async _detailHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const username: string | undefined = req.params.username;

            if (!username) {
                throw panic.code(ERROR_CODE.INSUFFICIENT_INFORMATION, 'username');
            }

            const account: IAccountModel | null = await AccountController.getAccountByUsername(username);

            if (!account) {
                throw panic.code(ERROR_CODE.ACCOUNT_NOT_FOUND, username);
            }

            res.agent.add('active', account.active);
            res.agent.add('username', account.username);
            res.agent.add('limbo', Boolean(account.limbo));
            res.agent.add('twoFA', Boolean(account.twoFA));
            res.agent.addIfExist('email', account.email);
            res.agent.addIfExist('phone', account.phone);
            res.agent.addIfExist('displayName', account.displayName);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
