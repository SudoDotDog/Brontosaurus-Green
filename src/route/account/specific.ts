/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Specific
 */

import { AccountController, GroupController, IAccountModel, IGroupModel, IOrganizationModel, OrganizationController } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { GroupAgent } from "../../agent/group";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { basicHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export class AccountListBySpecificRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/specific/:organization/:group';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.GET;

    public readonly groups: SudooExpressHandler[] = [
        basicHook.wrap(createGreenAuthHandler(), '/account/specific/:organization/:group - Green'),
        basicHook.wrap(this._specificAccountHandler.bind(this), '/account/specific/:organization/:group - List', true),
    ];

    private async _specificAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const groupName: string | undefined = req.params.group;

            if (!groupName) {
                throw panic.code(ERROR_CODE.INSUFFICIENT_INFORMATION, 'group');
            }

            const group: IGroupModel | null = await GroupController.getGroupByName(groupName);

            if (!group) {
                throw panic.code(ERROR_CODE.GROUP_NOT_FOUND, groupName);
            }

            const organizationName: string | undefined = req.params.organization;

            if (!organizationName) {
                throw panic.code(ERROR_CODE.INSUFFICIENT_INFORMATION, 'organization');
            }

            const organization: IOrganizationModel | null = await OrganizationController.getOrganizationByName(organizationName);

            if (!organization) {
                throw panic.code(ERROR_CODE.ORGANIZATION_NOT_FOUND, organizationName);
            }

            const accounts: IAccountModel[] = await AccountController.getActiveAccountByGroupAndOrganization(group._id, organization._id);

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
}
