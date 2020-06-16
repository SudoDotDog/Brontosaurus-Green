/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Agent
 * @description Organization
 */

import { IOrganizationModel, OrganizationController } from "@brontosaurus/db";
import { ObjectID } from "bson";

export class OrganizationAgent {

    public static create(): OrganizationAgent {

        return new OrganizationAgent();
    }

    private readonly _organizations: Map<string, IOrganizationModel>;

    private constructor() {

        this._organizations = new Map<string, IOrganizationModel>();
    }

    public async getOrganization(id: ObjectID | string): Promise<IOrganizationModel | null> {

        const strId: string = typeof id === 'string' ? id : id.toHexString();
        if (this._organizations.has(strId)) {
            return this._organizations.get(strId) as IOrganizationModel;
        }

        const organization: IOrganizationModel | null = await OrganizationController.getOrganizationById(new ObjectID(strId));
        if (organization) {
            this._organizations.set(strId, organization);
            return organization;
        }
        return null;
    }

    public async getOrganizations(ids: Array<ObjectID | string>): Promise<IOrganizationModel[]> {

        const response: IOrganizationModel[] = [];
        for (const id of ids) {

            const organization: IOrganizationModel | null = await this.getOrganization(id);
            if (organization) {
                response.push(organization);
            }
        }

        return response;
    }
}
