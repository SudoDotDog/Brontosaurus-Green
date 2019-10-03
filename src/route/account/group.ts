/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Group
 */

import { AccountController, GroupController, IAccountModel, IGroupModel } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { GroupAgent } from "../../agent/group";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export class AccountListByGroupRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/group/:group';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.GET;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._listAccountHandler.bind(this), 'List', true),
    ];

    private async _listAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

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

            const accounts: IAccountModel[] = await AccountController.getActiveAccountsByGroup(group._id);

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
