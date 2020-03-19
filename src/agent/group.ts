/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Agent
 * @description Group
 */

import { GroupController, IGroupModel } from "@brontosaurus/db";
import { ObjectID } from "bson";

export class GroupAgent {

    public static create(): GroupAgent {

        return new GroupAgent();
    }

    private readonly _groups: Map<string, IGroupModel>;

    private constructor() {

        this._groups = new Map<string, IGroupModel>();
    }

    public async getGroup(id: ObjectID | string): Promise<IGroupModel | null> {

        const strId: string = typeof id === 'string' ? id : id.toHexString();
        if (this._groups.has(strId)) {
            return this._groups.get(strId) as IGroupModel;
        }

        const group: IGroupModel | null = await GroupController.getGroupById(new ObjectID(strId));
        if (group) {
            this._groups.set(strId, group);
            return group;
        }
        return null;
    }

    public async getGroups(ids: Array<ObjectID | string>): Promise<IGroupModel[]> {

        const response: IGroupModel[] = [];
        for (const id of ids) {

            const group: IGroupModel | null = await this.getGroup(id);
            if (group) {
                response.push(group);
            }
        }

        return response;
    }
}
