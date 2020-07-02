/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Query
 */

import { IOrganizationModel, OrganizationController, TagController, IOrganization } from "@brontosaurus/db";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createListPattern, createStrictMapPattern, createStringPattern, Pattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { ObjectID } from "bson";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

const bodyPattern: Pattern = createStrictMapPattern({

    activation: createStringPattern({
        enum: ['active', 'inactive'],
        optional: true,
    }),
    tags: createListPattern(createStringPattern()),
});

export type QueryOrganizationRouteBody = {

    readonly activation?: 'active' | 'inactive';
    readonly tags: string[];
};

export type QueryOrganizationElement = {

    readonly name: string;
};

type OrganizationQuery = Partial<Record<keyof IOrganization, any>>;

export class QueryOrganizationRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/query';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._queryOrganizationRoute.bind(this), 'Query Organization'),
    ];

    private async _queryOrganizationRoute(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: QueryOrganizationRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            if (!Array.isArray(body.tags)) {
                throw panic.code(ERROR_CODE.INSUFFICIENT_SPECIFIC_INFORMATION, 'tags');
            }

            let query: OrganizationQuery = {};

            // Sync Query
            query = this._attachActivation(body.activation, query);

            // Async Query
            query = await this._attachTag(body.tags, query);

            const organizations: IOrganizationModel[] = await OrganizationController.getOrganizationsByQuery(query);

            const elements: QueryOrganizationElement[] = organizations.map((organization: IOrganizationModel) => {

                return {
                    name: organization.name,
                };
            });

            res.agent.add('organizations', elements);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private _attachActivation(
        activation: 'active' | 'inactive' | undefined,
        query: OrganizationQuery,
    ): OrganizationQuery {

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

    private async _attachTag(tagNames: string[], query: OrganizationQuery): Promise<OrganizationQuery> {

        if (tagNames.length === 0) {
            return query;
        }
        const tags: ObjectID[] = await TagController.getTagIdsByNames(tagNames);
        return {
            ...query,
            tags: {
                $in: tags,
            },
        };
    }
}
