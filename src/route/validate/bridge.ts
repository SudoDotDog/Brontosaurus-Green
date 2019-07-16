/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Validate
 * @description Bridge
 */

import { ApplicationController } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { Safe, SafeExtract } from "@sudoo/extract";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { basicHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export type ValidateBridgeRouteBody = {

    readonly key: string;
};

export class ValidateBridgeRoute extends BrontosaurusRoute {

    public readonly path: string = '/validate/bridge';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        basicHook.wrap(createGreenAuthHandler(), '/validate/bridge - Green'),
        basicHook.wrap(this._validateBridgeHandler.bind(this), '/validate/bridge - Validate Bridge', true),
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

            const isValid: boolean = await ApplicationController.checkGreenApplicationMatch(applicationKey, green);

            res.agent.add('valid', isValid);
        } catch (err) {
            res.agent.fail(400, err);
        } finally {
            next();
        }
    }
}
