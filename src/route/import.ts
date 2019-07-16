/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Routes
 * @description Import
 */

import { AccountListByGroupRoute } from "./account/group";
import { SingleOrganizationRoute } from "./organization/single";
import { OrganizationListByTagRoute } from "./organization/tag";

export const RouteList = [

    // Account
    new AccountListByGroupRoute(),

    // Organization
    new OrganizationListByTagRoute(),
    new SingleOrganizationRoute(),
];
