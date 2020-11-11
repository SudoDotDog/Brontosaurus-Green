/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Organization
 * @description Remove Tag
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
import { ObjectID } from "bson";

const bodyPattern: Pattern = createStrictMapPattern({

    organization: createStringPattern(),
    tag: createStringPattern(),
});

export type OrganizationRemoveTagRouteBody = {

    readonly organization: string;
    readonly tag: string;
};

export class OrganizationRemoveTagRoute extends BrontosaurusRoute {

    public readonly path: string = '/organization/remove-tag';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(createStringedBodyVerifyHandler(bodyPattern), 'Body Verify'),
        autoHook.wrap(this._organizationRemoveTagHandler.bind(this), 'Organization Remove Tag'),
    ];

    private async _organizationRemoveTagHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: OrganizationRemoveTagRouteBody = req.body;

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

            if (!this._hasTag(organization, tag)) {
                throw this._error(ERROR_CODE.TAG_NOT_FOUND, body.tag);
            }

            organization.tags = this._parseAfterRemoveTag(organization, tag);
            await organization.save();

            res.agent.add('organization', body.organization);
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }

    private _hasTag(organization: IOrganizationModel, tag: ITagModel): boolean {

        for (const organizationTag of organization.tags) {

            if (organizationTag.equals(tag._id)) {

                return true;
            }
        }
        return false;
    }

    private _parseAfterRemoveTag(organization: IOrganizationModel, tag: ITagModel): ObjectID[] {

        const newTags: ObjectID[] = [];
        for (const organizationTag of organization.tags) {

            if (!organizationTag.equals(tag._id)) {

                newTags.push(organizationTag);
            }
        }
        return newTags;
    }
}
