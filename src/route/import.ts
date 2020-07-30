/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Routes
 * @description Import
 */

import { AccountDetailRoute } from "./account/detail";
import { ReplaceAccountGroupRoute } from "./account/group/replace";
import { LimboAccountRoute } from "./account/limbo";
import { QueryAccountRoute } from "./account/query";
import { RegisterAccountRoute } from "./account/register";
import { ReplaceAccountTagRoute } from "./account/tag/replace";
import { UpdateAccountRoute } from "./account/update";
import { VerifyAccountRoute } from "./account/verify";
import { FetchPublicKeyRoute } from "./application/public-key";
import { QueryDecoratorRoute } from "./decorator/query";
import { QueryGroupRoute } from "./group/query";
import { QueryNamespaceRoute } from "./namespace/query";
import { InplodeOrganizationRoute } from "./organization/inplode";
import { QueryOrganizationRoute } from "./organization/query";
import { RegisterSubAccountRoute } from "./organization/register";
import { VerifyOrganizationRoute } from "./organization/verify";
import { QueryTagRoute } from "./tag/query";
import { ValidateBridgeRoute } from "./validate/bridge";
import { ValidateDirectRoute } from "./validate/direct";

export const RouteList = [

    // Account
    new AccountDetailRoute(),
    new LimboAccountRoute(),
    new QueryAccountRoute(),
    new RegisterAccountRoute(),
    new UpdateAccountRoute(),
    new VerifyAccountRoute(),

    // Account - Tag
    new ReplaceAccountTagRoute(),

    // Account - Group
    new ReplaceAccountGroupRoute(),

    // Application
    new FetchPublicKeyRoute(),

    // Organization
    new InplodeOrganizationRoute(),
    new QueryOrganizationRoute(),
    new RegisterSubAccountRoute(),
    new VerifyOrganizationRoute(),

    // Tag
    new QueryTagRoute(),

    // Decorator
    new QueryDecoratorRoute(),

    // Group
    new QueryGroupRoute(),

    // Namespace
    new QueryNamespaceRoute(),

    // Validate
    new ValidateBridgeRoute(),
    new ValidateDirectRoute(),
];
