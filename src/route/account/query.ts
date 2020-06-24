/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Query
 */

import { AccountController, GroupController, IAccountModel, IGroupModel, INamespaceModel, IOrganizationModel, ITagModel, OrganizationController, TagController } from "@brontosaurus/db";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createListPattern, createStrictMapPattern, createStringPattern, Pattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { ObjectID } from "bson";
import { GroupAgent } from "../../agent/group";
import { NamespaceAgent } from "../../agent/namespace";
import { OrganizationAgent } from "../../agent/organization";
import { TagAgent } from "../../agent/tag";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

const bodyPattern: Pattern = createStrictMapPattern({

    organizations: createListPattern(createStringPattern()),
    groups: createListPattern(createStringPattern()),
    groupsMode: createStringPattern({
        enum: ['and', 'or'],
        optional: true,
    }),
    tags: createListPattern(createStringPattern()),
    tagsMode: createStringPattern({
        enum: ['and', 'or'],
        optional: true,
    }),
});

export type QueryAccountRouteBody = {

    readonly organizations: string[];
    readonly groups: string[];
    readonly groupsMode?: 'and' | 'or';
    readonly tags: string[];
    readonly tagsMode?: 'and' | 'or';
};

export class QueryAccountRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/query';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._queryAccountHandler.bind(this), 'Query List'),
    ];

    private async _queryAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: QueryAccountRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            let query: Record<string, any> = {};

            query = await this._attachOrganization(
                body.organizations,
                query,
            );
            query = await this._attachGroup(
                body.groups,
                body.groupsMode ?? 'or',
                query,
            );
            query = await this._attachTag(
                body.tags,
                body.tagsMode ?? 'or',
                query,
            );

            const accounts: IAccountModel[] = await AccountController.getAccountsByQuery(query);

            const infos = [];
            const groupAgent: GroupAgent = GroupAgent.create();
            const tagAgent: TagAgent = TagAgent.create();
            const organizationAgent: OrganizationAgent = OrganizationAgent.create();
            const namespaceAgent: NamespaceAgent = NamespaceAgent.create();

            for (const account of accounts) {

                const groups: IGroupModel[] = await groupAgent.getGroups(account.groups);
                const tags: ITagModel[] = await tagAgent.getTags(account.tags);
                const organization: IOrganizationModel | null = account.organization ?
                    await organizationAgent.getOrganization(account.organization)
                    : null;
                const namespace: INamespaceModel | null = await namespaceAgent.getNamespace(account.namespace);

                if (!namespace) {
                    throw panic.code(ERROR_CODE.NAMESPACE_NOT_FOUND, account.namespace.toHexString());
                }

                const groupTexts: string[] = groups.map((each: IGroupModel) => each.name);
                const tagTexts: string[] = tags.map((each: ITagModel) => each.name);

                infos.push({
                    username: account.username,
                    namespace: namespace.namespace,
                    groups: groupTexts,
                    tags: tagTexts,
                    organization: organization
                        ? organization.name
                        : undefined,
                    displayName: account.displayName,
                });
            }

            res.agent.add('accounts', infos);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private async _attachOrganization(
        organizationNames: string[],
        query: Record<string, any>,
    ): Promise<Record<string, any>> {

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

    private async _attachGroup(
        groupNames: string[],
        mode: 'and' | 'or',
        query: Record<string, any>,
    ): Promise<Record<string, any>> {

        if (groupNames.length === 0) {
            return query;
        }
        const groups: ObjectID[] = await GroupController.getGroupIdsByNames(groupNames);

        if (mode === 'and') {
            return {
                ...query,
                groups: {
                    $all: groups,
                },
            };
        }

        return {
            ...query,
            groups: {
                $in: groups,
            },
        };
    }

    private async _attachTag(
        tagNames: string[],
        mode: 'and' | 'or',
        query: Record<string, any>,
    ): Promise<Record<string, any>> {

        if (tagNames.length === 0) {
            return query;
        }
        const tags: ObjectID[] = await TagController.getTagIdsByNames(tagNames);

        if (mode === 'and') {
            return {
                ...query,
                tags: {
                    $all: tags,
                },
            };
        }

        return {
            ...query,
            tags: {
                $in: tags,
            },
        };
    }
}
