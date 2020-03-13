/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Account
 * @description Verify
 */

import { AccountNamespaceMatch, IAccountModel, INamespaceModel, MatchController } from "@brontosaurus/db";
import { ROUTE_MODE, SudooExpressHandler, SudooExpressNextFunction, SudooExpressRequest, SudooExpressResponse } from "@sudoo/express";
import { Safe, SafeExtract } from "@sudoo/extract";
import { HTTP_RESPONSE_CODE } from "@sudoo/magic";
import { createGreenAuthHandler } from "../../handlers/handlers";
import { autoHook } from "../../handlers/hook";
import { ERROR_CODE, panic } from "../../util/error";
import { BrontosaurusRoute } from "../basic";

export type VerifyAccountRouteBody = {

    readonly username: string;
    readonly namespace: string;
};

export class VerifyAccountRoute extends BrontosaurusRoute {

    public readonly path: string = '/account/verify';
    public readonly mode: ROUTE_MODE = ROUTE_MODE.POST;

    public readonly groups: SudooExpressHandler[] = [
        autoHook.wrap(createGreenAuthHandler(), 'Green'),
        autoHook.wrap(this._verifyAccountHandler.bind(this), 'Verify Account'),
    ];

    private async _verifyAccountHandler(req: SudooExpressRequest, res: SudooExpressResponse, next: SudooExpressNextFunction): Promise<void> {

        const body: SafeExtract<VerifyAccountRouteBody> = Safe.extract(req.body as VerifyAccountRouteBody, this._error(ERROR_CODE.INSUFFICIENT_INFORMATION));

        try {

            if (!req.valid) {
                throw panic.code(ERROR_CODE.APPLICATION_GREEN_NOT_VALID);
            }

            const username: string = body.directEnsure('username');
            const namespace: string = body.directEnsure('namespace');

            const matchResult: AccountNamespaceMatch = await MatchController.getAccountNamespaceMatchByUsernameAndNamespace(username, namespace);

            if (matchResult.succeed === false) {

                res.agent.add('valid', false);
                return;
            }

            const account: IAccountModel = matchResult.account;
            const namespaceInstance: INamespaceModel = matchResult.namespace;
            res.agent.add('valid', true);

            if (account) {
                res.agent.add('account', {
                    username: account.username,
                    namespace: namespaceInstance.namespace,
                    displayName: account.displayName,
                });
            }
        } catch (err) {

            res.agent.fail(HTTP_RESPONSE_CODE.BAD_REQUEST, err);
        } finally {
            next();
        }
    }
}
