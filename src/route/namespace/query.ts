/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Namespace
 * @description Query
 */

import { INamespace, INamespaceModel, NamespaceController } from "@brontosaurus/db";
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

export type QueryNamespaceRouteBody = {

    readonly activation?: 'active' | 'inactive';
};

export type QueryNamespaceElement = {

    readonly name?: string;
    readonly namespace: string;
};

type NamespaceQuery = Partial<Record<keyof INamespace, any>>;

export class QueryNamespaceRoute extends BrontosaurusRoute {

    public readonly path: string = '/namespace/query';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._queryNamespaceRoute.bind(this), 'Query Namespace'),
    ];

    private async _queryNamespaceRoute(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: QueryNamespaceRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            let query: NamespaceQuery = {};

            // Sync Query
            query = this._attachActivation(body.activation, query);

            const namespaces: INamespaceModel[] = await NamespaceController.getNamespacesByQuery(query);

            const elements: QueryNamespaceElement[] = namespaces.map((namespace: INamespaceModel) => {

                return {
                    name: namespace.name,
                    namespace: namespace.namespace,
                };
            });

            res.agent.add('namespaces', elements);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private _attachActivation(
        activation: 'active' | 'inactive' | undefined,
        query: NamespaceQuery,
    ): NamespaceQuery {

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
