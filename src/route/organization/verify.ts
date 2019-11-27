/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Verify
 */

import { IOrganization, OrganizationController } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export class VerifyOrganizationRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/verify/:organization';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.GET;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._verifyOrganizationHandler.bind(this), 'Verify Organization', true),
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

            if (organization) {
                res.agent.add('organization', {
                    name: organization.name,
                });
            }
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
