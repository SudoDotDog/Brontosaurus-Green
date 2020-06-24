/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Detail
 */

import { AccountNamespaceMatch, GroupController, IAccountModel, IGroupModel, INamespaceModel, IOrganizationModel, ITagModel, MatchController, OrganizationController, TagController } from "@brontosaurus/db";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createStrictMapPattern, createStringPattern, Pattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { ObjectID } from "bson";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

const bodyPattern: Pattern = createStrictMapPattern({
    username: createStringPattern(),
    namespace: createStringPattern(),
});

export type AccountDetailRouteBody = {

    readonly username: string;
    readonly namespace: string;
};

export class AccountDetailRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/detail';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._detailHandler.bind(this), 'Account Detail'),
    ];

    private async _detailHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: AccountDetailRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            const match: AccountNamespaceMatch = await MatchController.getAccountNamespaceMatchByUsernameAndNamespace(body.username, body.namespace);

            if (match.succeed === false) {
                throw panic.code(ERROR_CODE.ACCOUNT_NOT_FOUND, body.username);
            }

            const account: IAccountModel = match.account;
            const namespaceInstance: INamespaceModel = match.namespace;

            const groups: IGroupModel[] = await GroupController.getGroupsByIds(account.groups);
            const tags: ITagModel[] = await TagController.getTagsByIds(account.tags);
            const organization: IOrganizationModel | null = await this._getOrganization(account.organization);

            const groupTexts: string[] = groups.map((each: IGroupModel) => each.name);
            const tagTexts: string[] = tags.map((each: ITagModel) => each.name);

            res.agent.add('active', account.active);
            res.agent.add('username', account.username);
            res.agent.add('namespace', namespaceInstance.namespace);
            res.agent.add('limbo', Boolean(account.limbo));
            res.agent.add('twoFA', Boolean(account.twoFA));
            res.agent.add('groups', groupTexts);
            res.agent.add('tags', tagTexts);
            res.agent.addIfExist('organization', organization
                ? organization.name
                : undefined);
            res.agent.addIfExist('email', account.email);
            res.agent.addIfExist('phone', account.phone);
            res.agent.addIfExist('displayName', account.displayName);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private async _getOrganization(organization?: ObjectID): Promise<IOrganizationModel | null> {

        if (!organization) {
            return null;
        }

        const instance: IOrganizationModel | null = await OrganizationController.getOrganizationById(organization);
        return instance;
    }
}
