/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Register Sub-Account
 */

import { AccountController, COMMON_NAME_VALIDATE_RESPONSE, EMAIL_VALIDATE_RESPONSE, GroupController, IAccountModel, IGroupModel, INamespaceModel, IOrganizationModel, isGroupModelInternalUserGroup, NamespaceController, OrganizationController, PHONE_VALIDATE_RESPONSE, TagController, USERNAME_VALIDATE_RESPONSE, validateCommonName, validateEmail, validatePhone, validateUsername } from "@brontosaurus/db";
import { Basics } from "@brontosaurus/definition";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createListPattern, createStrictMapPattern, createStringPattern, Pattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { ObjectID } from "bson";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { createInfoPattern } from "../../pattern/info";
import { createRandomTempPassword } from "../../util/auth";
import { ERROR_CODE, panic } from "../../util/error";
import { jsonifyBasicRecords } from "../../util/token";
import { BrontosaurusRoute } from "../basic";

const bodyPattern: Pattern = createStrictMapPattern({

    organization: createStringPattern(),

    username: createStringPattern(),
    namespace: createStringPattern(),
    userInfos: createInfoPattern(),
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

export type RegisterSubAccountRouteBody = {

    readonly organization: string;

    readonly username: string;
    readonly namespace: string;
    readonly userInfos: Record<string, Basics> | string;
    readonly userGroups: string[];
    readonly userTags: string[];

    readonly userDisplayName?: string;
    readonly userEmail?: string;
    readonly userPhone?: string;
};

export class RegisterSubAccountRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/register/sub-account';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._registerSubAccountHandler.bind(this), 'Register Sub Account'),
    ];

    private async _registerSubAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: RegisterSubAccountRouteBody = req.body;

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
                this._error(ERROR_CODE.INFO_LINE_FORMAT_ERROR, body.userInfos.toString()));

            if (!Array.isArray(body.userTags)) {
                throw this._error(ERROR_CODE.INSUFFICIENT_INFORMATION, body.userTags as any);
            }

            if (!Array.isArray(body.userGroups)) {
                throw this._error(ERROR_CODE.INSUFFICIENT_INFORMATION, body.userGroups as any);
            }

            const usernameValidationResult: USERNAME_VALIDATE_RESPONSE = validateUsername(body.username);

            if (usernameValidationResult !== USERNAME_VALIDATE_RESPONSE.OK) {
                throw this._error(ERROR_CODE.INVALID_USERNAME, usernameValidationResult);
            }

            const validateResult: COMMON_NAME_VALIDATE_RESPONSE = validateCommonName(body.organization);

            if (validateResult !== COMMON_NAME_VALIDATE_RESPONSE.OK) {
                throw this._error(ERROR_CODE.INVALID_COMMON_NAME, validateResult);
            }

            const namespaceInstance: INamespaceModel | null = await NamespaceController.getNamespaceByNamespace(body.namespace);

            if (!namespaceInstance) {
                throw panic.code(ERROR_CODE.NAMESPACE_NOT_FOUND, body.namespace);
            }

            if (req.body.userEmail) {

                const emailValidationResult: EMAIL_VALIDATE_RESPONSE = validateEmail(req.body.userEmail);
                if (emailValidationResult !== EMAIL_VALIDATE_RESPONSE.OK) {
                    throw this._error(ERROR_CODE.INVALID_EMAIL, emailValidationResult);
                }
            }

            if (req.body.userPhone) {

                const phoneValidationResult: PHONE_VALIDATE_RESPONSE = validatePhone(req.body.userPhone);
                if (phoneValidationResult !== PHONE_VALIDATE_RESPONSE.OK) {
                    throw this._error(ERROR_CODE.INVALID_PHONE, phoneValidationResult);
                }
            }

            if (req.body.userDisplayName) {

                if (typeof req.body.userDisplayName !== 'string') {
                    throw panic.code(ERROR_CODE.INVALID_DISPLAY_NAME, req.body.displayName);
                }
            }

            const organization: IOrganizationModel | null = await OrganizationController.getOrganizationByName(body.organization);

            if (!organization) {
                throw panic.code(ERROR_CODE.ORGANIZATION_NOT_FOUND, body.organization);
            }

            const accountCount: number = await AccountController.getAccountCountByOrganization(organization._id);

            if (accountCount >= organization.limit) {
                throw this._error(ERROR_CODE.ORGANIZATION_LIMIT_EXCEED, accountCount.toString(), organization.limit.toString());
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

            account.organization = organization._id;

            account.tags = parsedUserTagIds;
            account.groups = parsedGroups.map((group: IGroupModel) => group._id);

            await account.save();

            res.agent.add('account', account.username);
            res.agent.add('namespace', namespaceInstance.namespace);
            res.agent.add('tempPassword', tempPassword);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
