/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Single Organization
 */

import { IOrganizationModel, OrganizationController } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export class SingleOrganizationRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/single/:name';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.GET;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._singleOrganizationHandler.bind(this), 'Single Organization', true),
    ];

    private async _singleOrganizationHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const name: string | undefined = req.params.name;

            if (!name) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN);
            }

            const decoded: string = decodeURIComponent(name);
            const organization: IOrganizationModel | null = await OrganizationController.getOrganizationByName(decoded);

            if (!organization) {
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
