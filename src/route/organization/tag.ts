/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Tag
 */

import { IOrganizationModel, ITagModel, OrganizationController, TagController } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export class OrganizationListByTagRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/list/:tag';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.GET;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._listOrganizationHandler.bind(this), 'Organizations By Tag', true),
    ];

    private async _listOrganizationHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const tagName: string | undefined = req.params.tag;

            if (!tagName) {
                throw panic.code(ERROR_CODE.INSUFFICIENT_INFORMATION, 'tag');
            }

            const tag: ITagModel | null = await TagController.getTagByName(tagName);

            if (!tag) {
                throw panic.code(ERROR_CODE.TAG_NOT_FOUND, tagName);
            }

            const organizations: IOrganizationModel[] = await OrganizationController.getActiveOrganizationsByTags([tag._id]);
            const names: string[] = organizations.map((organization: IOrganizationModel) => organization.name);

            res.agent.add('names', names);
        } catch (err) {
            res.agent.fail(400, err);
        } finally {
            next();
        }
    }
}
