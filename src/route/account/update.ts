/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Update
 */

import { AccountController, EMAIL_VALIDATE_RESPONSE, IAccountModel, PHONE_VALIDATE_RESPONSE, validateEmail, validatePhone } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { Safe, SafeExtract } from "@sudoo/extract";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

// TODO: ADD Namespace
export type UpdateAccountRouteBody = {

    readonly username: string;

    readonly displayName?: string;
    readonly email?: string;
    readonly phone?: string;
};

export class UpdateAccountRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/update';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._updateAccountHandler.bind(this), 'Update Account'),
    ];

    private async _updateAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: SafeExtract<UpdateAccountRouteBody> = Safe.extract(req.body as UpdateAccountRouteBody, this._error(ERROR_CODE.INSUFFICIENT_INFORMATION));

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const username: string = body.directEnsure('username');

            const account: IAccountModel | null = await AccountController.getAccountByUsername(username);

            if (!account) {
                throw this._error(ERROR_CODE.ACCOUNT_NOT_FOUND, username);
            }

            if (this._updateEmail(account, req.body.email)
                || this._updatePhone(account, req.body.phone)
                || this._updateDisplayName(account, req.body.displayName)) {

                await account.save();
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

    private _updateEmail(account: IAccountModel, email?: string): boolean {

        if (email) {

            const emailValidationResult: EMAIL_VALIDATE_RESPONSE = validateEmail(email);
            if (emailValidationResult !== EMAIL_VALIDATE_RESPONSE.OK) {
                throw this._error(ERROR_CODE.INVALID_EMAIL, emailValidationResult);
            }

            account.email = email;
            return true;
        }
        return false;
    }

    private _updatePhone(account: IAccountModel, phone?: string): boolean {

        if (phone) {

            const phoneValidationResult: PHONE_VALIDATE_RESPONSE = validatePhone(phone);
            if (phoneValidationResult !== PHONE_VALIDATE_RESPONSE.OK) {
                throw this._error(ERROR_CODE.INVALID_PHONE, phoneValidationResult);
            }

            account.phone = phone;
            return true;
        }
        return false;
    }

    private _updateDisplayName(account: IAccountModel, displayName?: string): boolean {

        if (displayName) {

            account.displayName = displayName;
            return true;
        }
        return false;
    }
}
