/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Limbo
 */

import { AccountController, IAccountModel } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { Safe, SafeExtract } from "@sudoo/extract";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { createRandomTempPassword } from "../../util/auth";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export type LimboAccountRouteBody = {

    readonly username: string;
};

export class LimboAccountRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/limbo';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._limboAccountHandler.bind(this), 'Limbo Account', true),
    ];

    private async _limboAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: SafeExtract<LimboAccountRouteBody> = Safe.extract(req.body as LimboAccountRouteBody, this._error(ERROR_CODE.INSUFFICIENT_INFORMATION));

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const username: string = body.directEnsure('username');

            const account: IAccountModel | null = await AccountController.getAccountByUsername(username);

            if (!account) {
                throw this._error(ERROR_CODE.ACCOUNT_NOT_FOUND, username);
            }

            const tempPassword: string = createRandomTempPassword();
            account.limbo = true;
            account.setPassword(tempPassword);
            account.resetAttempt();

            await account.save();

            res.agent.add('limbo', Boolean(account.limbo));
            res.agent.add('tempPassword', tempPassword);
        } catch (err) {
            res.agent.fail(400, err);
        } finally {
            next();
        }
    }
}
