/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Routes
 * @description Import
 */

import { AccountListByGroupRoute } from "./account/group";
import { OrganizationAllRoute } from "./organization/all";
import { SingleOrganizationRoute } from "./organization/single";
import { OrganizationListByTagRoute } from "./organization/tag";
import { ValidateBridgeRoute } from "./validate/bridge";

export const RouteList = [

    // Account
    new AccountListByGroupRoute(),

    // Organization
    new OrganizationAllRoute(),
    new OrganizationListByTagRoute(),
    new SingleOrganizationRoute(),

    // Validate
    new ValidateBridgeRoute(),
];
