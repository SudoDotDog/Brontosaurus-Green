/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Query
 */

import { AccountController, GroupController, IAccount, IAccountModel, IGroupModel, INamespaceModel, IOrganizationModel, ITagModel, NamespaceController, OrganizationController, TagController } from "@brontosaurus/db";
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

    activation: createStringPattern({
        enum: ['active', 'inactive'],
        optional: true,
    }),
    namespace: createStringPattern({
        optional: true,
    }),

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

    readonly activation?: 'active' | 'inactive';
    readonly namespace?: string;

    readonly organizations: string[];

    readonly groups: string[];
    readonly groupsMode?: 'and' | 'or';

    readonly tags: string[];
    readonly tagsMode?: 'and' | 'or';
};

export type QueryAccountElement = {

    readonly username: string;
    readonly namespace: string;
    readonly groups: string[];
    readonly tags: string[];
    readonly organization?: string;
    readonly displayName?: string;
    readonly email?: string;
    readonly phone?: string;
};

type AccountQuery = Partial<Record<keyof IAccount, any>>;

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

            let query: AccountQuery = {};

            // Sync Query
            query = this._attachActivation(body.activation, query);

            // Async Query
            query = await this._attachNamespace(body.namespace, query);
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

            const infos: QueryAccountElement[] = [];
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
                    email: account.email,
                    phone: account.phone,
                });
            }

            res.agent.add('count', infos.length);
            res.agent.add('accounts', infos);
        } catch (err) {
            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private _attachActivation(
        activation: 'active' | 'inactive' | undefined,
        query: AccountQuery,
    ): AccountQuery {

        if (activation === 'active') {
            return {
                ...query,
                active: true,
            };
        }
        if (activation === 'inactive') {
            return {
                ...query,
                active: false,
            };
        }
        return query;
    }

    private async _attachNamespace(
        namespace: string | undefined,
        query: AccountQuery,
    ): Promise<AccountQuery> {

        if (!namespace) {
            return query;
        }
        const namespaceInstance: INamespaceModel | null = await NamespaceController.getNamespaceByNamespace(namespace);
        if (!namespaceInstance) {
            return query;
        }

        return {
            ...query,
            namespace: namespaceInstance._id,
        };
    }

    private async _attachOrganization(
        organizationNames: string[],
        query: AccountQuery,
    ): Promise<AccountQuery> {

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
        query: AccountQuery,
    ): Promise<AccountQuery> {

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
        query: AccountQuery,
    ): Promise<AccountQuery> {

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
