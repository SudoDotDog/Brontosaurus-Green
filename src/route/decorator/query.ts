/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Decorator
 * @description Query
 */

import { DecoratorController, IDecorator, IDecoratorModel } from "@brontosaurus/db";
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

export type QueryDecoratorRouteBody = {

    readonly activation?: 'active' | 'inactive';
};

export type QueryDecoratorElement = {

    readonly name: string;
};

type DecoratorQuery = Partial<Record<keyof IDecorator, any>>;

export class QueryDecoratorRoute extends BrontosaurusRoute {

    public readonly path: string = '/decorator/query';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._queryDecoratorRoute.bind(this), 'Query Decorator'),
    ];

    private async _queryDecoratorRoute(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: QueryDecoratorRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            let query: DecoratorQuery = {};

            // Sync Query
            query = this._attachActivation(body.activation, query);

            const decorators: IDecoratorModel[] = await DecoratorController.getDecoratorsByQuery(query);

            const elements: QueryDecoratorElement[] = decorators.map((decorator: IDecoratorModel) => {

                return {
                    name: decorator.name,
                };
            });

            res.agent.add('decorators', elements);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private _attachActivation(
        activation: 'active' | 'inactive' | undefined,
        query: DecoratorQuery,
    ): DecoratorQuery {

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
