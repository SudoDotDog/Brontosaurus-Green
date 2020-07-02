/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Routes
 * @description Basic
 */

import { ISudooExpressRoute, ROUTE_MODE, SudooExpressErrorInfo, SudooExpressHandler } from "@sudoo/express";
import { SudooLog } from '@sudoo/log';
import { ConnorError, ErrorCreationFunction } from "connor";
import { getErrorCreationFunction } from "../util/error";

export abstract class BrontosaurusRoute implements ISudooExpressRoute {

    protected readonly _error: ErrorCreationFunction = getErrorCreationFunction();
    protected readonly _log: SudooLog = SudooLog.global;

    public abstract readonly path: string;
    public abstract readonly mode: ROUTE_MODE;
    public abstract readonly groups: SudooExpressHandler[];

    public onError(code: number, error: Error): SudooExpressErrorInfo {

        const err: ConnorError = error as any;
        this._log.error(`${this.path} - ${err.message} (${code})`);

        return {
            code,
            response: {
                status: code,
                code: err.code,
                description: err.description,
                message: String(err.message),
            },
        };
    }
}
