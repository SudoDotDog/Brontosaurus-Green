/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Validate
 * @description Bridge
 */

import { ApplicationController, IApplicationModel } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { Safe, SafeExtract } from "@sudoo/extract";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export type ValidateBridgeRouteBody = {

    readonly key: string;
};

export class ValidateBridgeRoute extends BrontosaurusRoute {

    public readonly path: string = '/validate/bridge';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._validateBridgeHandler.bind(this), 'Validate Bridge', true),
    ];

    private async _validateBridgeHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: SafeExtract<ValidateBridgeRouteBody> = Safe.extract(req.body as ValidateBridgeRouteBody, panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN));

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const auth: string = body.direct('key');

            const splited: string[] = auth.split(':');

            if (splited.length !== 2) {
                throw panic.code(ERROR_CODE.REQUEST_FORMAT_ERROR, 'key-length', '2', splited.length.toString());
            }

            const applicationKey: string = splited[0];
            const green: string = splited[1];

            if (typeof applicationKey !== 'string' || typeof green !== 'string') {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const application: IApplicationModel | null = await ApplicationController.getApplicationByKey(applicationKey);

            if (!application) {
                throw panic.code(ERROR_CODE.APPLICATION_NOT_FOUND, applicationKey);
            }

            if (!application.greenAccess) {
                throw panic.code(ERROR_CODE.APPLICATION_HAS_NO_GREEN_ACCESS);
            }

            const isValid: boolean = application.green === green;

            res.agent.add('valid', isValid);
        } catch (err) {
            res.agent.fail(400, err);
        } finally {
            next();
        }
    }
}
