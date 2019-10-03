/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description All
 */

import { OrganizationController } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export class OrganizationAllRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/list';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.GET;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._listOrganizationHandler.bind(this), 'List All', true),
    ];

    private async _listOrganizationHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const names: string[] = await OrganizationController.getAllActiveOrganizationName();

            res.agent.add('names', names);
        } catch (err) {
            res.agent.fail(400, err);
        } finally {
            next();
        }
    }
}
