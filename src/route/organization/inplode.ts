/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Inplode Organization
 */

import { AccountController, COMMON_NAME_VALIDATE_RESPONSE, EMAIL_VALIDATE_RESPONSE, GroupController, IAccountModel, IGroupModel, INamespaceModel, IOrganizationModel, isGroupModelInternalUserGroup, NamespaceController, OrganizationController, PHONE_VALIDATE_RESPONSE, TagController, USERNAME_VALIDATE_RESPONSE, validateCommonName, validateEmail, validateNamespace, validatePhone, validateUsername } from "@brontosaurus/db";
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

export type InplodeOrganizationRouteBody = {

    readonly organizationName: string;
    readonly organizationTags: string[];
    readonly ownerInfos: Record<string, Basics>;
    readonly ownerUsername: string;
    readonly ownerNamespace: string;
    readonly ownerGroups: string[];
    readonly ownerTags: string[];

    readonly ownerDisplayName?: string;
    readonly ownerEmail?: string;
    readonly ownerPhone?: string;
};

export class InplodeOrganizationRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/inplode';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._inplodeOrganizationHandler.bind(this), 'Inplode Organization'),
    ];

    private async _inplodeOrganizationHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: SafeExtract<InplodeOrganizationRouteBody> = Safe.extract(req.body as InplodeOrganizationRouteBody, this._error(ERROR_CODE.INSUFFICIENT_INFORMATION));

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const organizationName: string = body.directEnsure('organizationName');

            const username: string = body.directEnsure('ownerUsername');
            const namespace: string = body.directEnsure('ownerNamespace');

            const organizationTags: string[] = body.direct('organizationTags');
            const ownerTags: string[] = body.direct('ownerTags');
            const groups: string[] = body.direct('ownerGroups');

            if (!Array.isArray(organizationTags)) {
                throw this._error(ERROR_CODE.INSUFFICIENT_INFORMATION, organizationTags as any);
            }

            if (!Array.isArray(ownerTags)) {
                throw this._error(ERROR_CODE.INSUFFICIENT_INFORMATION, ownerTags as any);
            }

            if (!Array.isArray(groups)) {
                throw this._error(ERROR_CODE.INSUFFICIENT_INFORMATION, groups as any);
            }

            const usernameValidationResult: USERNAME_VALIDATE_RESPONSE = validateUsername(username);

            if (usernameValidationResult !== USERNAME_VALIDATE_RESPONSE.OK) {
                throw this._error(ERROR_CODE.INVALID_USERNAME, usernameValidationResult);
            }

            const namespaceValidationResult: boolean = validateNamespace(namespace);

            if (!namespaceValidationResult) {
                throw this._error(ERROR_CODE.INVALID_NAMESPACE, usernameValidationResult);
            }

            const validateResult: COMMON_NAME_VALIDATE_RESPONSE = validateCommonName(organizationName);

            if (validateResult !== COMMON_NAME_VALIDATE_RESPONSE.OK) {
                throw this._error(ERROR_CODE.INVALID_COMMON_NAME, validateResult);
            }

            if (req.body.ownerEmail) {

                const emailValidationResult: EMAIL_VALIDATE_RESPONSE = validateEmail(req.body.ownerEmail);
                if (emailValidationResult !== EMAIL_VALIDATE_RESPONSE.OK) {
                    throw this._error(ERROR_CODE.INVALID_EMAIL, emailValidationResult);
                }
            }

            if (req.body.ownerPhone) {

                const phoneValidationResult: PHONE_VALIDATE_RESPONSE = validatePhone(req.body.ownerPhone);
                if (phoneValidationResult !== PHONE_VALIDATE_RESPONSE.OK) {
                    throw this._error(ERROR_CODE.INVALID_PHONE, phoneValidationResult);
                }
            }

            if (req.body.ownerDisplayName) {

                if (typeof req.body.ownerDisplayName !== 'string') {
                    throw panic.code(ERROR_CODE.INVALID_DISPLAY_NAME, req.body.displayName);
                }
            }

            const infoLine: Record<string, Basics> | string = body.direct('ownerInfos');
            const infos: Record<string, Basics> = jsonifyBasicRecords(
                infoLine,
                this._error(ERROR_CODE.INFO_LINE_FORMAT_ERROR, infoLine.toString()));

            const namespaceInstance: INamespaceModel | null = await NamespaceController.getNamespaceByNamespace(namespace);

            if (!namespaceInstance) {
                throw panic.code(ERROR_CODE.NAMESPACE_NOT_FOUND, namespace);
            }

            const isAccountDuplicated: boolean = await AccountController.isAccountDuplicatedByUsernameAndNamespace(username, namespaceInstance._id);

            if (isAccountDuplicated) {
                throw this._error(ERROR_CODE.DUPLICATE_ACCOUNT, username);
            }

            const isOrganizationDuplicated: boolean = await OrganizationController.isOrganizationDuplicatedByName(organizationName);

            if (isOrganizationDuplicated) {
                throw this._error(ERROR_CODE.DUPLICATE_ORGANIZATION, organizationName);
            }

            const parsedOrganizationTagIds: ObjectID[] = await TagController.getTagIdsByNames(organizationTags);
            const parsedOwnerTagIds: ObjectID[] = await TagController.getTagIdsByNames(ownerTags);
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
                namespaceInstance._id,
                req.body.ownerDisplayName,
                req.body.ownerEmail,
                req.body.ownerPhone,
                undefined,
                [],
                infos,
            );
            const organization: IOrganizationModel = OrganizationController.createUnsavedOrganization(organizationName, account._id);

            organization.tags = parsedOrganizationTagIds;

            account.tags = parsedOwnerTagIds;
            account.groups = parsedGroups.map((group: IGroupModel) => group._id);
            account.organization = organization._id;

            await Promise.all([account.save(), organization.save()]);

            res.agent.add('account', account.username);
            res.agent.add('organization', organization.name);
            res.agent.add('tempPassword', tempPassword);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
