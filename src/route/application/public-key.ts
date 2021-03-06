/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Application
 * @description Public Key
 */

import { ApplicationController, IApplicationModel } from "@brontosaurus/db";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createStrictMapPattern, createStringPattern, Pattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

const bodyPattern: Pattern = createStrictMapPattern({

    applicationKey: createStringPattern({
        minimumLength: 1,
    }),
});

export type FetchPublicKeyRouteBody = {

    readonly applicationKey: string;
};

export class FetchPublicKeyRoute extends BrontosaurusRoute {

    public readonly path: string = '/application/public-key/fetch';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._fetchPublicKeyRoute.bind(this), 'Fetch Public Key'),
    ];

    private async _fetchPublicKeyRoute(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: FetchPublicKeyRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            const application: IApplicationModel | null = await ApplicationController.getApplicationByKey(body.applicationKey);

            if (!application) {
                throw panic.code(ERROR_CODE.APPLICATION_NOT_FOUND, body.applicationKey);
            }

            res.agent.add('applicationKey', application.key);
            res.agent.add('publicKey', application.publicKey);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
