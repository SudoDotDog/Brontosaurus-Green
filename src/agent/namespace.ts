/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Agent
 * @description Namespace
 */

import { INamespaceModel, NamespaceController } from "@brontosaurus/db";
import { ObjectID } from "bson";

export class NamespaceAgent {

    public static create(): NamespaceAgent {

        return new NamespaceAgent();
    }

    private readonly _namespaces: Map<string, INamespaceModel>;

    private constructor() {

        this._namespaces = new Map<string, INamespaceModel>();
    }

    public async getNamespace(id: ObjectID | string): Promise<INamespaceModel | null> {

        const strId: string = typeof id === 'string' ? id : id.toHexString();
        if (this._namespaces.has(strId)) {
            return this._namespaces.get(strId) as INamespaceModel;
        }

        const namespace: INamespaceModel | null = await NamespaceController.getNamespaceById(new ObjectID(strId));
        if (namespace) {
            this._namespaces.set(strId, namespace);
            return namespace;
        }
        return null;
    }

    public async getNamespaces(ids: Array<ObjectID | string>): Promise<INamespaceModel[]> {

        const response: INamespaceModel[] = [];
        for (const id of ids) {

            const namespace: INamespaceModel | null = await this.getNamespace(id);
            if (namespace) {
                response.push(namespace);
            }
        }

        return response;
    }
}
