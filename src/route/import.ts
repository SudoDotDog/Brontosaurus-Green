/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Routes
 * @description Import
 */

import { AccountDetailRoute } from "./account/detail";
import { ReplaceAccountGroupRoute } from "./account/group/replace";
import { AccountHistoryRecordRoute } from "./account/history/record";
import { LimboAccountRoute } from "./account/limbo";
import { QueryAccountRoute } from "./account/query";
import { RegisterAccountRoute } from "./account/register";
import { ReplaceAccountTagRoute } from "./account/tag/replace";
import { UpdateAccountRoute } from "./account/update";
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
    new RegisterAccountRoute(),
    new UpdateAccountRoute(),
    new VerifyAccountRoute(),

    // Account - History
    new AccountHistoryRecordRoute(),

    // Account - Tag
    new ReplaceAccountTagRoute(),

    // Account - Group
    new ReplaceAccountGroupRoute(),

    // Organization
    new InplodeOrganizationRoute(),
    new QueryOrganizationRoute(),
    new RegisterSubAccountRoute(),
    new VerifyOrganizationRoute(),

    // Validate
    new ValidateBridgeRoute(),
    new ValidateDirectRoute(),
];
