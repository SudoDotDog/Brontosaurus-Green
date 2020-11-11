/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Add Tag
 */

import { IOrganizationModel, ITagModel, OrganizationController, TagController } from "@brontosaurus/db";
import { createStringedBodyVerifyHandler, ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createStrictMapPattern, createStringPattern, Pattern } from "@sudoo/pattern";
import { fillStringedResult, StringedResult } from "@sudoo/verify";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

const bodyPattern: Pattern = createStrictMapPattern({

    organization: createStringPattern(),
    tag: createStringPattern(),
});

export type OrganizationAddTagRouteBody = {

    readonly organization: string;
    readonly tag: string;
};

export class OrganizationAddTagRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/add-tag';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._organizationAddTagHandler.bind(this), 'Organization Add Tag'),
    ];

    private async _organizationAddTagHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: OrganizationAddTagRouteBody = req.body;

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const verify: StringedResult = fillStringedResult(req.stringedBodyVerify);

            if (!verify.succeed) {
                throw panic.code(ERROR_CODE.REQUEST_DOES_MATCH_PATTERN, verify.invalids[0]);
            }

            const organization: IOrganizationModel | null = await OrganizationController.getOrganizationByName(body.organization);

            if (!organization) {
                throw this._error(ERROR_CODE.ORGANIZATION_NOT_FOUND, body.organization);
            }

            const tag: ITagModel | null = await TagController.getTagByName(body.tag);

            if (!tag) {
                throw this._error(ERROR_CODE.TAG_NOT_FOUND, body.tag);
            }

            for (const organizationTag of organization.tags) {

                if (organizationTag.equals(tag._id)) {

                    throw this._error(ERROR_CODE.DUPLICATE_TAG, body.tag);
                }
            }

            organization.tags = [...organization.tags, tag._id];
            await organization.save();

            res.agent.add('organization', body.organization);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
