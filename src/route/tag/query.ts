/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Tag
 * @description Query
 */

import { ITag, ITagModel, TagController } from "@brontosaurus/db";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createStrictMapPattern, createStringPattern, Pattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

const bodyPattern: Pattern = createStrictMapPattern({

    activation: createStringPattern({
        enum: ['active', 'inactive'],
        optional: true,
    }),
});

export type QueryTagRouteBody = {

    readonly activation?: 'active' | 'inactive';
};

export type QueryTagElement = {

    readonly name: string;
};

type TagQuery = Partial<Record<keyof ITag, any>>;

export class QueryTagRoute extends BrontosaurusRoute {

    public readonly path: string = '/tag/query';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._queryTagRoute.bind(this), 'Query Tag'),
    ];

    private async _queryTagRoute(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: QueryTagRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            let query: TagQuery = {};

            // Sync Query
            query = this._attachActivation(body.activation, query);

            const tags: ITagModel[] = await TagController.getTagsByQuery(query);

            const elements: QueryTagElement[] = tags.map((tag: ITagModel) => {

                return {
                    name: tag.name,
                };
            });

            res.agent.add('tags', elements);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private _attachActivation(
        activation: 'active' | 'inactive' | undefined,
        query: TagQuery,
    ): TagQuery {

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
}
