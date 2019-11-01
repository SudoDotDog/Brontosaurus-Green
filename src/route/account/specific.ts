/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Specific
 */

import { AccountController, GroupController, IAccountModel, IGroupModel, OrganizationController } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { Safe, SafeExtract } from "@sudoo/extract";
import { ObjectID } from "bson";
import { GroupAgent } from "../../agent/group";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export type AccountListBySpecificRouteBody = {

    readonly organizations: string[];
    readonly groups: string[];
};

export class AccountListBySpecificRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/specific';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._specificAccountHandler.bind(this), 'Specific List', true),
    ];

    private async _specificAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: SafeExtract<AccountListBySpecificRouteBody> = Safe.extract(req.body as AccountListBySpecificRouteBody, this._error(ERROR_CODE.INSUFFICIENT_INFORMATION));

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            let query: Record<string, any> = {};

            const groupNames: string[] = body.direct('groups');
            if (!Array.isArray(groupNames)) {
                throw panic.code(ERROR_CODE.INSUFFICIENT_SPECIFIC_INFORMATION, 'groups');
            }

            query = await this._attachGroup(groupNames, query);

            const organizationNames: string[] = body.direct('organizations');
            if (!Array.isArray(organizationNames)) {
                throw panic.code(ERROR_CODE.INSUFFICIENT_SPECIFIC_INFORMATION, 'organizations');
            }
            query = await this._attachOrganization(organizationNames, query);

            const accounts: IAccountModel[] = await AccountController.getAccountsByQuery(query);

            const infos = [];
            const agent: GroupAgent = GroupAgent.create();

            for (const account of accounts) {

                const groups: IGroupModel[] = await agent.getGroups(account.groups);
                const groupTexts: string[] = groups.map((each: IGroupModel) => each.name);
                infos.push({
                    username: account.username,
                    groups: groupTexts,
                    displayName: account.displayName,
                });
            }

            res.agent.add('accounts', infos);
        } catch (err) {
            res.agent.fail(400, err);
        } finally {
            next();
        }
    }

    private async _attachGroup(groupNames: string[], query: Record<string, any>): Promise<Record<string, any>> {

        if (groupNames.length === 0) {
            return query;
        }
        const groups: ObjectID[] = await GroupController.getGroupIdsByNames(groupNames);
        return {
            ...query,
            groups: {
                $in: groups,
            },
        };
    }

    private async _attachOrganization(organizationNames: string[], query: Record<string, any>): Promise<Record<string, any>> {

        if (organizationNames.length === 0) {
            return query;
        }
        const organizations: ObjectID[] = await OrganizationController.getOrganizationIdsByNames(organizationNames);
        return {
            ...query,
            organization: {
                $in: organizations,
            },
        };
    }
}
