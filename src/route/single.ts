/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Routes
 * @description Single Organization
 */

import { IOrganizationModel, OrganizationController } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { createGreenAuthHandler } from "../handlers/handlers";
import { basicHook } from "../handlers/hook";
import { ERROR_CODE, panic } from "../util/error";
import { BrontosaurusRoute } from "./basic";

export class SingleOrganizationRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/single/:name';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.GET;

    public readonly groups: SudooExpressHandler[] = [
        basicHook.wrap(createGreenAuthHandler(), '/organization/single/:name - Green'),
        basicHook.wrap(this._singleOrganizationHandler.bind(this), '/organization/single/:name - list', true),
    ];

    private async _singleOrganizationHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const name: string | undefined = req.params.name;

            if (!name) {
                throw panic.code(ERROR_CODE.ORGANIZATION_NOT_FOUND);
            }

            const organization: IOrganizationModel | null = await OrganizationController.getOrganizationByName(name);

            if (!name) {
                throw panic.code(ERROR_CODE.ORGANIZATION_NOT_FOUND);
            }

            res.agent.add('name', organization.name);
            res.agent.add('owner', organization.owner);
        } catch (err) {
            res.agent.fail(400, err);
        } finally {
            next();
        }
    }
}
