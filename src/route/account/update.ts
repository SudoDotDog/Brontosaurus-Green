/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Update
 */

import { EMAIL_VALIDATE_RESPONSE, IAccountModel, MatchController, PHONE_VALIDATE_RESPONSE, validateEmail, validatePhone } from "@brontosaurus/db";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createStrictMapPattern, createStringPattern, Pattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

const bodyPattern: Pattern = createStrictMapPattern({

    username: createStringPattern(),
    namespace: createStringPattern(),

    avatar: createStringPattern({
        optional: true,
    }),
    displayName: createStringPattern({
        optional: true,
    }),
    email: createStringPattern({
        optional: true,
    }),
    phone: createStringPattern({
        optional: true,
    }),
});

export type UpdateAccountRouteBody = {

    readonly username: string;
    readonly namespace: string;

    readonly avatar?: string;
    readonly displayName?: string;
    readonly email?: string;
    readonly phone?: string;
};

export class UpdateAccountRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/update';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._updateAccountHandler.bind(this), 'Update Account'),
    ];

    private async _updateAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: UpdateAccountRouteBody = req.body;

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
                throw this._error(ERROR_CODE.ACCOUNT_NOT_FOUND, body.username);
            }

            const updateAvatarResult: boolean = this._updateAvatar(account, body.avatar);
            const updateEmailResult: boolean = this._updateEmail(account, body.email);
            const updatePhoneResult: boolean = this._updatePhone(account, body.phone);
            const updateDisplayNameResult: boolean = this._updateDisplayName(account, body.displayName);

            const shouldSave: boolean = updateAvatarResult
                || updateEmailResult
                || updatePhoneResult
                || updateDisplayNameResult;

            if (shouldSave) {
                await account.save();
            }

            res.agent.add('active', account.active);
            res.agent.add('saved', shouldSave);
            res.agent.add('username', account.username);
            res.agent.add('limbo', Boolean(account.limbo));
            res.agent.add('twoFA', Boolean(account.twoFA));
            res.agent.addIfExist('avatar', account.avatar);
            res.agent.addIfExist('email', account.email);
            res.agent.addIfExist('phone', account.phone);
            res.agent.addIfExist('displayName', account.displayName);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private _updateAvatar(account: IAccountModel, avatar?: string): boolean {

        if (avatar) {

            account.avatar = avatar;
            return true;
        }
        return false;
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
