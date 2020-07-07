/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Handlers
 * @description Authenticate
 */

import { ApplicationController, IApplicationModel } from "@brontosaurus/db";
import { SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { parseBearerAuthorization } from "../util/auth";

const verifyGreenAccess = async (applicationKey: string, green: string): Promise<boolean> => {

    if (typeof applicationKey !== 'string' || typeof green !== 'string') {
        return false;
    }

    const application: IApplicationModel | null = await ApplicationController.getApplicationByKey(applicationKey);

    if (!application) {
        return false;
    }

    if (!application.active) {
        return false;
    }

    if (!application.greenAccess) {
        return false;
    }

    return application.green === green;
};

export const createGreenAuthHandler = (): SudooExpressHandler =>
    async (req: SudooExpressRequest, _: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> => {

        const authHeader: string | undefined = req.header('authorization') || req.header('Authorization');
        const auth: string | null = parseBearerAuthorization(authHeader);

        if (!auth) {
            req.valid = false;
            next();
            return;
        }

        const splited: string[] = auth.split(':');

        if (splited.length !== 2) {
            req.valid = false;
            next();
            return;
        }

        const applicationKey: string = splited[0];
        const green: string = splited[1];

        const isValid: boolean = await verifyGreenAccess(applicationKey, green);

        req.valid = isValid;

        next();
        return;
    };
