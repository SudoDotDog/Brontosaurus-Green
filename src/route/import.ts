/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Routes
 * @description Import
 */

import { AccountDetailRoute } from "./account/detail";
import { LimboAccountRoute } from "./account/limbo";
import { QueryAccountRoute } from "./account/query";
import { VerifyAccountRoute } from "./account/verify";
import { InplodeOrganizationRoute } from "./organization/inplode";
import { QueryOrganizationRoute } from "./organization/query";
import { RegisterSubAccountRoute } from "./organization/register";
import { VerifyOrganizationRoute } from "./organization/verify";
import { ValidateBridgeRoute } from "./validate/bridge";
import { ValidateDirectRoute } from "./validate/direct";

export const RouteList = [

    // Account
    new AccountDetailRoute(),
    new LimboAccountRoute(),
    new QueryAccountRoute(),
    new VerifyAccountRoute(),

    // Organization
    new InplodeOrganizationRoute(),
    new QueryOrganizationRoute(),
    new RegisterSubAccountRoute(),
    new VerifyOrganizationRoute(),

    // Validate
    new ValidateBridgeRoute(),
    new ValidateDirectRoute(),
];
