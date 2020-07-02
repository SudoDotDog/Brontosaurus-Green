/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Group
 * @description Query
 */

import { GroupController, IGroup, IGroupModel } from "@brontosaurus/db";
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
        enum: ['activate', 'inactivate'],
        optional: true,
    }),
});

export type QueryGroupRouteBody = {

    readonly activation?: 'activate' | 'inactivate';
};

type GroupQuery = Partial<Record<keyof IGroup, any>>;

export class QueryGroupRoute extends BrontosaurusRoute {

    public readonly path: string = '/group/query';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._queryGroupRoute.bind(this), 'Query Group'),
    ];

    private async _queryGroupRoute(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: QueryGroupRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            let query: GroupQuery = {};

            // Sync Query
            query = this._attachActivation(body.activation, query);

            const groups: IGroupModel[] = await GroupController.getGroupsByQuery(query);

            const names: string[] = groups.map((group: IGroupModel) => group.name);

            res.agent.add('names', names);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private _attachActivation(
        activation: 'activate' | 'inactivate' | undefined,
        query: GroupQuery,
    ): GroupQuery {

        if (activation === 'activate') {
            return {
                ...query,
                active: true,
            };
        }
        if (activation === 'inactivate') {
            return {
                ...query,
                active: false,
            };
        }
        return query;
    }
}
