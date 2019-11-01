/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Routes
 * @description Import
 */

import { AccountDetailRoute } from "./account/detail";
import { AccountListByGroupRoute } from "./account/group";
import { LimboAccountRoute } from "./account/limbo";
import { AccountListByOrganizationRoute } from "./account/organization";
import { AccountListBySpecificRoute } from "./account/specific";
import { VerifyAccountRoute } from "./account/verify";
import { OrganizationAllRoute } from "./organization/all";
import { InplodeOrganizationRoute } from "./organization/inplode";
import { SingleOrganizationRoute } from "./organization/single";
import { OrganizationListByTagRoute } from "./organization/tag";
import { VerifyOrganizationRoute } from "./organization/verify";
import { ValidateBridgeRoute } from "./validate/bridge";
import { ValidateDirectRoute } from "./validate/direct";

export const RouteList = [

    // Account
    new AccountListByGroupRoute(),
    new AccountListByOrganizationRoute(),
    new AccountListBySpecificRoute(),
    new AccountDetailRoute(),
    new VerifyAccountRoute(),
    new LimboAccountRoute(),

    // Organization
    new OrganizationAllRoute(),
    new OrganizationListByTagRoute(),
    new SingleOrganizationRoute(),
    new VerifyOrganizationRoute(),
    new InplodeOrganizationRoute(),

    // Validate
    new ValidateBridgeRoute(),
    new ValidateDirectRoute(),
];
