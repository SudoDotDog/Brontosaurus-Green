/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Register Sub-Account
 */

import { AccountController, COMMON_NAME_VALIDATE_RESPONSE, EMAIL_VALIDATE_RESPONSE, GroupController, IAccountModel, IGroupModel, IOrganizationModel, isGroupModelInternalUserGroup, OrganizationController, PHONE_VALIDATE_RESPONSE, TagController, USERNAME_VALIDATE_RESPONSE, validateCommonName, validateEmail, validatePhone, validateUsername } from "@brontosaurus/db";
import { Basics } from "@brontosaurus/definition";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { Safe, SafeExtract } from "@sudoo/extract";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { ObjectID } from "bson";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { createRandomTempPassword } from "../../util/auth";
import { ERROR_CODE, panic } from "../../util/error";
import { jsonifyBasicRecords } from "../../util/token";
import { BrontosaurusRoute } from "../basic";

export type RegisterSubAccountRouteBody = {

    readonly organization: string;

    readonly username: string;
    readonly userInfos: Record<string, Basics>;
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
        autoHook.wrap(this._registerSubAccountHandler.bind(this), 'Register Sub Account'),
    ];

    private async _registerSubAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: SafeExtract<RegisterSubAccountRouteBody> = Safe.extract(req.body as RegisterSubAccountRouteBody, this._error(ERROR_CODE.INSUFFICIENT_INFORMATION));

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const username: string = body.directEnsure('username');
            const userTags: string[] = body.direct('userTags');
            const groups: string[] = body.direct('userGroups');

            const organizationName: string = body.directEnsure('organization');

            const infoLine: Record<string, Basics> | string = body.direct('userInfos');
            const infos: Record<string, Basics> = jsonifyBasicRecords(
                infoLine,
                this._error(ERROR_CODE.INFO_LINE_FORMAT_ERROR, infoLine.toString()));

            if (!Array.isArray(userTags)) {
                throw this._error(ERROR_CODE.INSUFFICIENT_INFORMATION, userTags as any);
            }

            if (!Array.isArray(groups)) {
                throw this._error(ERROR_CODE.INSUFFICIENT_INFORMATION, groups as any);
            }

            const usernameValidationResult: USERNAME_VALIDATE_RESPONSE = validateUsername(username);

            if (usernameValidationResult !== USERNAME_VALIDATE_RESPONSE.OK) {
                throw this._error(ERROR_CODE.INVALID_USERNAME, usernameValidationResult);
            }

            const validateResult: COMMON_NAME_VALIDATE_RESPONSE = validateCommonName(organizationName);

            if (validateResult !== COMMON_NAME_VALIDATE_RESPONSE.OK) {
                throw this._error(ERROR_CODE.INVALID_COMMON_NAME, validateResult);
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

            const organization: IOrganizationModel | null = await OrganizationController.getOrganizationByName(organizationName);

            if (!organization) {
                throw panic.code(ERROR_CODE.ORGANIZATION_NOT_FOUND, organizationName);
            }

            const accountCount: number = await AccountController.getAccountCountByOrganization(organization._id);

            if (accountCount >= organization.limit) {
                throw this._error(ERROR_CODE.ORGANIZATION_LIMIT_EXCEED, accountCount.toString(), organization.limit.toString());
            }

            const isAccountDuplicated: boolean = await AccountController.isAccountDuplicatedByUsername(username);

            if (isAccountDuplicated) {
                throw this._error(ERROR_CODE.DUPLICATE_ACCOUNT, username);
            }

            const parsedUserTagIds: ObjectID[] = await TagController.getTagIdsByNames(userTags);
            const parsedGroups: IGroupModel[] = await GroupController.getGroupByNames(groups);

            for (const group of parsedGroups) {
                if (isGroupModelInternalUserGroup(group)) {
                    throw panic.code(ERROR_CODE.CANNOT_MODIFY_INTERNAL_GROUP);
                }
            }

            const tempPassword: string = createRandomTempPassword();

            const account: IAccountModel = AccountController.createOnLimboUnsavedAccount(
                username,
                tempPassword,
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
            res.agent.add('tempPassword', tempPassword);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
