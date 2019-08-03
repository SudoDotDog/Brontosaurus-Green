/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Verify
 */

import { IOrganization, OrganizationController } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { basicHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export class VerifyOrganizationRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/verify/:organization';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.GET;

    public readonly groups: SudooExpressHandler[] = [
        basicHook.wrap(createGreenAuthHandler(), '/organization/verify/:organization - Green'),
        basicHook.wrap(this._verifyOrganizationHandler.bind(this), '/organization/verify/:organization - Verify Organization', true),
    ];

    private async _verifyOrganizationHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const organizationName: string | undefined = req.params.organization;

            if (!organizationName) {
                throw panic.code(ERROR_CODE.INSUFFICIENT_INFORMATION, 'organization');
            }

            const organization: IOrganization | null = await OrganizationController.getOrganizationByNameLean(organizationName);

            res.agent.add('valid', Boolean(organization));
            res.agent.add('organization', {
                name: organization.name,
            });
        } catch (err) {
            res.agent.fail(400, err);
        } finally {
            next();
        }
    }
}
