/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Routes
 * @description Import
 */

import { AccountDetailRoute } from "./account/detail";
import { LimboAccountRoute } from "./account/limbo";
import { QueryAccountRoute } from "./account/query";
import { VerifyAccountRoute } from "./account/verify";
import { OrganizationAllRoute } from "./organization/all";
import { InplodeOrganizationRoute } from "./organization/inplode";
import { QueryOrganizationRoute } from "./organization/query";
import { VerifyOrganizationRoute } from "./organization/verify";
import { ValidateBridgeRoute } from "./validate/bridge";
import { ValidateDirectRoute } from "./validate/direct";

export const RouteList = [

    // Account
    new QueryAccountRoute(),
    new AccountDetailRoute(),
    new VerifyAccountRoute(),
    new LimboAccountRoute(),

    // Organization
    new QueryOrganizationRoute(),
    new OrganizationAllRoute(),
    new VerifyOrganizationRoute(),
    new InplodeOrganizationRoute(),

    // Validate
    new ValidateBridgeRoute(),
    new ValidateDirectRoute(),
];
