/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Inplode Organization
 */

import { AccountController, COMMON_NAME_VALIDATE_RESPONSE, EMAIL_VALIDATE_RESPONSE, GroupController, IAccountModel, IGroupModel, INamespaceModel, IOrganizationModel, isGroupModelInternalUserGroup, NamespaceController, OrganizationController, PASSWORD_VALIDATE_RESPONSE, PHONE_VALIDATE_RESPONSE, TagController, USERNAME_VALIDATE_RESPONSE, validateCommonName, validateEmail, validateNamespace, validatePassword, validatePhone, validateUsername } from "@brontosaurus/db";
import { Basics } from "@brontosaurus/definition";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { SudooExpressResponseAgent } from "@sudoo/express/agent";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createListPattern, createRecordPattern, createStrictMapPattern, createStringPattern, Pattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { ObjectID } from "bson";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { createRandomTempPassword } from "../../util/auth";
import { ERROR_CODE, panic } from "../../util/error";
import { jsonifyBasicRecords } from "../../util/token";
import { BrontosaurusRoute } from "../basic";

const bodyPattern: Pattern = createStrictMapPattern({

    organizationName: createStringPattern(),
    organizationTags: createListPattern(createStringPattern()),
    ownerInfos: {
        type: 'or',
        options: [
            createStringPattern(),
            createRecordPattern(
                createStringPattern(),
                { type: 'any' },
            ),
        ],
    },
    ownerUsername: createStringPattern(),
    ownerNamespace: createStringPattern(),
    ownerGroups: createListPattern(createStringPattern()),
    ownerTags: createListPattern(createStringPattern()),

    ownerDisplayName: createStringPattern({
        optional: true,
    }),
    ownerEmail: createStringPattern({
        optional: true,
    }),
    ownerPhone: createStringPattern({
        optional: true,
    }),

    ownerPassword: createStringPattern({
        optional: true,
    }),
});

export type InplodeOrganizationRouteBody = {

    readonly organizationName: string;
    readonly organizationTags: string[];
    readonly ownerInfos: Record<string, Basics> | string;
    readonly ownerUsername: string;
    readonly ownerNamespace: string;
    readonly ownerGroups: string[];
    readonly ownerTags: string[];

    readonly ownerDisplayName?: string;
    readonly ownerEmail?: string;
    readonly ownerPhone?: string;

    readonly ownerPassword?: string;
};

export class InplodeOrganizationRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/inplode';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._inplodeOrganizationHandler.bind(this), 'Inplode Organization'),
    ];

    private async _inplodeOrganizationHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: InplodeOrganizationRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            if (!Array.isArray(body.organizationTags)) {
                throw this._error(ERROR_CODE.INSUFFICIENT_INFORMATION, body.organizationTags as any);
            }

            if (!Array.isArray(body.ownerTags)) {
                throw this._error(ERROR_CODE.INSUFFICIENT_INFORMATION, body.ownerTags as any);
            }

            if (!Array.isArray(body.ownerGroups)) {
                throw this._error(ERROR_CODE.INSUFFICIENT_INFORMATION, body.ownerGroups as any);
            }

            const usernameValidationResult: USERNAME_VALIDATE_RESPONSE = validateUsername(body.ownerUsername);

            if (usernameValidationResult !== USERNAME_VALIDATE_RESPONSE.OK) {
                throw this._error(ERROR_CODE.INVALID_USERNAME, usernameValidationResult);
            }

            const namespaceValidationResult: boolean = validateNamespace(body.ownerNamespace);

            if (!namespaceValidationResult) {
                throw this._error(ERROR_CODE.INVALID_NAMESPACE, usernameValidationResult);
            }

            const validateResult: COMMON_NAME_VALIDATE_RESPONSE = validateCommonName(body.organizationName);

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

            if (req.body.ownerPassword) {

                const passwordValidationResult: PASSWORD_VALIDATE_RESPONSE = validatePassword(req.body.ownerPassword);
                if (passwordValidationResult !== PASSWORD_VALIDATE_RESPONSE.OK) {
                    throw panic.code(ERROR_CODE.INVALID_PASSWORD, passwordValidationResult);
                }
            }

            const infos: Record<string, Basics> = jsonifyBasicRecords(
                body.ownerInfos,
                this._error(ERROR_CODE.INFO_LINE_FORMAT_ERROR, body.ownerInfos.toString()));

            const namespaceInstance: INamespaceModel | null = await NamespaceController.getNamespaceByNamespace(body.ownerNamespace);

            if (!namespaceInstance) {
                throw panic.code(ERROR_CODE.NAMESPACE_NOT_FOUND, body.ownerNamespace);
            }

            const isAccountDuplicated: boolean = await AccountController.isAccountDuplicatedByUsernameAndNamespace(body.ownerUsername, namespaceInstance._id);

            if (isAccountDuplicated) {
                throw this._error(ERROR_CODE.DUPLICATE_ACCOUNT, body.ownerUsername);
            }

            const isOrganizationDuplicated: boolean = await OrganizationController.isOrganizationDuplicatedByName(body.organizationName);

            if (isOrganizationDuplicated) {
                throw this._error(ERROR_CODE.DUPLICATE_ORGANIZATION, body.organizationName);
            }

            const parsedOrganizationTagIds: ObjectID[] = await TagController.getTagIdsByNames(body.organizationTags);
            const parsedOwnerTagIds: ObjectID[] = await TagController.getTagIdsByNames(body.ownerTags);
            const parsedGroups: IGroupModel[] = await GroupController.getGroupByNames(body.ownerGroups);

            for (const group of parsedGroups) {
                if (isGroupModelInternalUserGroup(group)) {
                    throw panic.code(ERROR_CODE.CANNOT_MODIFY_INTERNAL_GROUP);
                }
            }

            const account: IAccountModel = this._createAccount({
                username: body.ownerUsername,
                namespace: namespaceInstance,
                displayName: req.body.ownerDisplayName,
                ownerEmail: req.body.ownerEmail,
                ownerPhone: req.body.ownerPhone,
                ownerPassword: req.body.ownerPassword,
                infos,
            }, res.agent);

            const organization: IOrganizationModel = OrganizationController.createUnsavedOrganization(body.organizationName, account._id);

            organization.tags = parsedOrganizationTagIds;

            account.tags = parsedOwnerTagIds;
            account.groups = parsedGroups.map((group: IGroupModel) => group._id);
            account.organization = organization._id;

            await Promise.all([account.save(), organization.save()]);

            res.agent.add('account', account.username);
            res.agent.add('namespace', namespaceInstance.namespace);
            res.agent.add('organization', organization.name);
        } catch (err) {
            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private _createAccount(config: {
        readonly username: string;
        readonly namespace: INamespaceModel;
        readonly displayName?: string;
        readonly ownerEmail?: string;
        readonly ownerPhone?: string;
        readonly ownerPassword?: string;
        readonly infos?: Record<string, any>;
    }, agent: SudooExpressResponseAgent) {

        if (config.ownerPassword) {
            return AccountController.createUnsavedAccount(
                config.username,
                config.ownerPassword,
                config.namespace._id,
                config.displayName,
                config.ownerEmail,
                config.ownerPhone,
                undefined,
                [],
                config.infos,
            );
        }

        const tempPassword: string = createRandomTempPassword();
        agent.add('tempPassword', tempPassword);

        return AccountController.createOnLimboUnsavedAccount(
            config.username,
            tempPassword,
            config.namespace._id,
            config.displayName,
            config.ownerEmail,
            config.ownerPhone,
            undefined,
            [],
            config.infos,
        );
    }
}
