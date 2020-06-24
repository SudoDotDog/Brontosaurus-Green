/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Register Account
 */

import { AccountController, EMAIL_VALIDATE_RESPONSE, GroupController, IAccountModel, IGroupModel, INamespaceModel, isGroupModelInternalUserGroup, NamespaceController, PHONE_VALIDATE_RESPONSE, TagController, USERNAME_VALIDATE_RESPONSE, validateEmail, validatePhone, validateUsername } from "@brontosaurus/db";
import { Basics } from "@brontosaurus/definition";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { Pattern, createStrictMapPattern, createListPattern, createStringPattern, createRecordPattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { ObjectID } from "bson";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { createRandomTempPassword } from "../../util/auth";
import { ERROR_CODE, panic } from "../../util/error";
import { jsonifyBasicRecords } from "../../util/token";
import { BrontosaurusRoute } from "../basic";

const bodyPattern: Pattern = createStrictMapPattern({

    username: createStringPattern(),
    namespace: createStringPattern(),
    userInfos: {
        type: 'or',
        options: [
            createStringPattern(),
            createRecordPattern(
                createStringPattern(),
                { type: 'any' },
            ),
        ],
    },
    userGroups: createListPattern(createStringPattern()),
    userTags: createListPattern(createStringPattern()),

    userDisplayName: createStringPattern({
        optional: true,
    }),
    userEmail: createStringPattern({
        optional: true,
    }),
    userPhone: createStringPattern({
        optional: true,
    }),
});

export type RegisterAccountRouteBody = {

    readonly username: string;
    readonly namespace: string;
    readonly userInfos: Record<string, Basics> | string;
    readonly userGroups: string[];
    readonly userTags: string[];

    readonly userDisplayName?: string;
    readonly userEmail?: string;
    readonly userPhone?: string;
};

export class RegisterAccountRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/register';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._registerAccountHandler.bind(this), 'Register Account'),
    ];

    private async _registerAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: RegisterAccountRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            const infos: Record<string, Basics> = jsonifyBasicRecords(
                body.userInfos,
                this._error(ERROR_CODE.INFO_LINE_FORMAT_ERROR, body.userInfos.toString()),
            );

            const namespaceInstance: INamespaceModel | null = await NamespaceController.getNamespaceByNamespace(body.namespace);

            if (!namespaceInstance) {
                throw panic.code(ERROR_CODE.NAMESPACE_NOT_FOUND, body.namespace);
            }

            const usernameValidationResult: USERNAME_VALIDATE_RESPONSE = validateUsername(body.username);

            if (usernameValidationResult !== USERNAME_VALIDATE_RESPONSE.OK) {
                throw this._error(ERROR_CODE.INVALID_USERNAME, usernameValidationResult);
            }

            if (body.userEmail) {

                const emailValidationResult: EMAIL_VALIDATE_RESPONSE = validateEmail(body.userEmail);
                if (emailValidationResult !== EMAIL_VALIDATE_RESPONSE.OK) {
                    throw this._error(ERROR_CODE.INVALID_EMAIL, emailValidationResult);
                }
            }

            if (body.userPhone) {

                const phoneValidationResult: PHONE_VALIDATE_RESPONSE = validatePhone(body.userPhone);
                if (phoneValidationResult !== PHONE_VALIDATE_RESPONSE.OK) {
                    throw this._error(ERROR_CODE.INVALID_PHONE, phoneValidationResult);
                }
            }

            if (body.userDisplayName) {

                if (typeof body.userDisplayName !== 'string') {
                    throw panic.code(ERROR_CODE.INVALID_DISPLAY_NAME, body.userDisplayName);
                }
            }

            const isAccountDuplicated: boolean = await AccountController.isAccountDuplicatedByUsernameAndNamespace(body.username, namespaceInstance._id);

            if (isAccountDuplicated) {
                throw this._error(ERROR_CODE.DUPLICATE_ACCOUNT, body.username);
            }

            const parsedUserTagIds: ObjectID[] = await TagController.getTagIdsByNames(body.userTags);
            const parsedGroups: IGroupModel[] = await GroupController.getGroupByNames(body.userGroups);

            for (const group of parsedGroups) {
                if (isGroupModelInternalUserGroup(group)) {
                    throw panic.code(ERROR_CODE.CANNOT_MODIFY_INTERNAL_GROUP);
                }
            }

            const tempPassword: string = createRandomTempPassword();

            const account: IAccountModel = AccountController.createOnLimboUnsavedAccount(
                body.username,
                tempPassword,
                namespaceInstance._id,
                req.body.userDisplayName,
                req.body.userEmail,
                req.body.userPhone,
                undefined,
                [],
                infos,
            );

            account.tags = parsedUserTagIds;
            account.groups = parsedGroups.map((group: IGroupModel) => group._id);

            await account.save();

            res.agent.add('account', account.username);
            res.agent.add('tempPassword', tempPassword);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
