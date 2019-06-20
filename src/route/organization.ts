/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Routes
 * @description Organization
 */

import { INTERNAL_USER_GROUP } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { createAuthenticateHandler, createGroupVerifyHandler, createTokenHandler } from "../handlers/handlers";
import { basicHook } from "../handlers/hook";
import { BrontosaurusRoute } from "./basic";

export class OrganizationListRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/list';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.GET;

    public readonly groups: SudooExpressHandler[] = [
        basicHook.wrap(createTokenHandler(), '/organization/list - TokenHandler'),
        basicHook.wrap(createAuthenticateHandler(), '/organization/list - AuthenticateHandler'),
        basicHook.wrap(createGroupVerifyHandler([INTERNAL_USER_GROUP.SUPER_ADMIN], this._error), '/organization/list - GroupVerifyHandler'),
        basicHook.wrap(this._listOrganizationHandler.bind(this), '/organization/list - list', true),
    ];

    private async _listOrganizationHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        try {

            console.log(123);
        } catch (err) {
            res.agent.fail(400, err);
        } finally {
            next();
        }
    }
}
