/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Specific
 */

import { IOrganizationModel, OrganizationController, TagController } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { Safe, SafeExtract } from "@sudoo/extract";
import { ObjectID } from "bson";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export type QueryOrganizationRouteBody = {

    readonly tags: string[];
};

export class QueryOrganizationRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/query';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._queryOrganizationRoute.bind(this), 'Query Organization', true),
    ];

    private async _queryOrganizationRoute(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: SafeExtract<QueryOrganizationRouteBody> = Safe.extract(req.body as QueryOrganizationRouteBody, this._error(ERROR_CODE.INSUFFICIENT_INFORMATION));

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            let query: Record<string, any> = {};

            const tagNames: string[] = body.direct('tags');
            if (!Array.isArray(tagNames)) {
                throw panic.code(ERROR_CODE.INSUFFICIENT_SPECIFIC_INFORMATION, 'tags');
            }

            query = await this._attachTag(tagNames, query);

            const organizations: IOrganizationModel[] = await OrganizationController.getOrganizationsByQuery(query);

            const names: string[] = organizations.map((organization: IOrganizationModel) => organization.name);

            res.agent.add('names', names);
        } catch (err) {
            res.agent.fail(400, err);
        } finally {
            next();
        }
    }

    private async _attachTag(tagNames: string[], query: Record<string, any>): Promise<Record<string, any>> {

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