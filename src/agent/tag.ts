/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Agent
 * @description Tag
 */

import { ITagModel, TagController } from "@brontosaurus/db";
import { ObjectID } from "bson";

export class TagAgent {

    public static create(): TagAgent {

        return new TagAgent();
    }

    private readonly _tags: Map<string, ITagModel>;

    private constructor() {

        this._tags = new Map<string, ITagModel>();
    }

    public async getTag(id: ObjectID | string): Promise<ITagModel | null> {

        const strId: string = typeof id === 'string' ? id : id.toHexString();
        if (this._tags.has(strId)) {
            return this._tags.get(strId) as ITagModel;
        }

        const tag: ITagModel | null = await TagController.getTagById(new ObjectID(strId));
        if (tag) {
            this._tags.set(strId, tag);
            return tag;
        }
        return null;
    }

    public async getTags(ids: Array<ObjectID | string>): Promise<ITagModel[]> {

        const response: ITagModel[] = [];
        for (const id of ids) {

            const tag: ITagModel | null = await this.getTag(id);
            if (tag) {
                response.push(tag);
            }
        }

        return response;
    }
}
