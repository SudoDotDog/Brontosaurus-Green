/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Util
 * @description Error
 */

import { Connor, Panic, ErrorCreationFunction } from 'connor';

export const MODULE_NAME = 'Brontosaurus-Green';

export enum ERROR_CODE {

    TOKEN_INVALID = 4106,
    TOKEN_EXPIRED = 4107,

    INVALID_USERNAME = 4110,
    INVALID_PASSWORD = 4111,
    INVALID_COMMON_NAME = 4112,
    INVALID_COMMON_KEY = 4113,
    INVALID_EMAIL = 4114,
    INVALID_PHONE = 4115,
    INVALID_DISPLAY_NAME = 4116,
    INVALID_NAMESPACE = 4117,

    APPLICATION_KEY_NOT_FOUND = 4120,
    APPLICATION_GREEN_NOT_VALID = 4121,
    APPLICATION_HAS_NO_GREEN_ACCESS = 4122,

    ACCOUNT_ORGANIZATION_NOT_FOUND = 4135,

    TOKEN_DOES_NOT_CONTAIN_INFORMATION = 4150,
    TOKEN_DOES_NOT_CONTAIN_HEADER = 4151,
    TOKEN_DOES_NOT_CONTAIN_BODY = 4152,
    TOKEN_DOES_NOT_CONTAIN_ORGANIZATION = 4153,

    INSUFFICIENT_INFORMATION = 4500,
    INSUFFICIENT_SPECIFIC_INFORMATION = 4501,

    INFO_LINE_FORMAT_ERROR = 4506,

    INVALID_ACCOUNT_ACTION = 4601,

    REQUEST_DOES_MATCH_PATTERN = 5005,
    REQUEST_FORMAT_ERROR = 5006,

    APPLICATION_NOT_FOUND = 6200,
    GROUP_NOT_FOUND = 6201,
    ACCOUNT_NOT_FOUND = 6202,
    ORGANIZATION_NOT_FOUND = 6203,
    TAG_NOT_FOUND = 6204,
    NAMESPACE_NOT_FOUND = 6205,

    DUPLICATE_ACCOUNT = 6250,
    DUPLICATE_APPLICATION = 6251,
    DUPLICATE_GROUP = 6252,
    DUPLICATE_ORGANIZATION = 6253,
    DUPLICATE_DECORATOR = 6254,
    DUPLICATE_TAG = 6255,

    ALREADY_ACTIVATED = 6325,
    ALREADY_DEACTIVATED = 6326,

    ORGANIZATION_LIMIT_EXCEED = 6400,

    CANNOT_MODIFY_INTERNAL_GROUP = 6701,

    NOT_ENOUGH_PERMISSION = 7001,
    PERMISSION_USER_DOES_NOT_MATCH = 7002,

    INTERNAL_ERROR = 8000,
}

export const ERROR_LIST: Record<ERROR_CODE, string> = {

    [ERROR_CODE.TOKEN_INVALID]: 'Token invalid',
    [ERROR_CODE.TOKEN_EXPIRED]: 'Token expired',

    [ERROR_CODE.INVALID_USERNAME]: 'Invalid username, reason: "{}"',
    [ERROR_CODE.INVALID_PASSWORD]: 'Invalid password, reason: "{}"',
    [ERROR_CODE.INVALID_COMMON_NAME]: 'Invalid common name, reason: "{}"',
    [ERROR_CODE.INVALID_COMMON_KEY]: 'Invalid common key, reason: "{}"',
    [ERROR_CODE.INVALID_EMAIL]: 'Invalid email, reason: "{}"',
    [ERROR_CODE.INVALID_PHONE]: 'Invalid phone, reason: "{}"',
    [ERROR_CODE.INVALID_DISPLAY_NAME]: 'Invalid display name "{}"',
    [ERROR_CODE.INVALID_NAMESPACE]: 'Invalid namespace "{}"',

    [ERROR_CODE.APPLICATION_KEY_NOT_FOUND]: 'Application key not found',
    [ERROR_CODE.APPLICATION_GREEN_NOT_VALID]: 'Application green not valid',
    [ERROR_CODE.APPLICATION_HAS_NO_GREEN_ACCESS]: 'Application has no green access',

    [ERROR_CODE.ACCOUNT_ORGANIZATION_NOT_FOUND]: 'Account organization not found',

    [ERROR_CODE.TOKEN_DOES_NOT_CONTAIN_INFORMATION]: 'Token does not contain information: "{}"',
    [ERROR_CODE.TOKEN_DOES_NOT_CONTAIN_HEADER]: 'Token does not contain header',
    [ERROR_CODE.TOKEN_DOES_NOT_CONTAIN_BODY]: 'Token does not contain body',
    [ERROR_CODE.TOKEN_DOES_NOT_CONTAIN_ORGANIZATION]: 'Token does not contain organization',

    [ERROR_CODE.INSUFFICIENT_INFORMATION]: 'Insufficient information',
    [ERROR_CODE.INSUFFICIENT_SPECIFIC_INFORMATION]: 'Insufficient information, need: "{}"',

    [ERROR_CODE.INFO_LINE_FORMAT_ERROR]: 'Info line: "{}" format error',

    [ERROR_CODE.INVALID_ACCOUNT_ACTION]: 'Invalid account action type: "{}"',

    [ERROR_CODE.REQUEST_DOES_MATCH_PATTERN]: 'Request does not match pattern: "{}"',
    [ERROR_CODE.REQUEST_FORMAT_ERROR]: 'Request format error: "{}", should be: "{}", but: "{}"',

    [ERROR_CODE.APPLICATION_NOT_FOUND]: 'Application: "{}" not found',
    [ERROR_CODE.GROUP_NOT_FOUND]: 'Group: "{}" not found',
    [ERROR_CODE.ACCOUNT_NOT_FOUND]: 'Account: "{}" not found',
    [ERROR_CODE.ORGANIZATION_NOT_FOUND]: 'Organization: "{}" not found',
    [ERROR_CODE.TAG_NOT_FOUND]: 'Tag: "{}" not found',
    [ERROR_CODE.NAMESPACE_NOT_FOUND]: 'Namespace: "{}" not found',

    [ERROR_CODE.DUPLICATE_ACCOUNT]: 'Account: "{}" already exist',
    [ERROR_CODE.DUPLICATE_APPLICATION]: 'Application: "{}" already exist',
    [ERROR_CODE.DUPLICATE_GROUP]: 'Group: "{}" already exist',
    [ERROR_CODE.DUPLICATE_ORGANIZATION]: 'Organization: "{}" already exist',
    [ERROR_CODE.DUPLICATE_DECORATOR]: 'Decorator: "{}" already exist',
    [ERROR_CODE.DUPLICATE_TAG]: 'Tag: "{}" already exist',

    [ERROR_CODE.ALREADY_ACTIVATED]: 'Already Activated: "{}"',
    [ERROR_CODE.ALREADY_DEACTIVATED]: 'Already Deactivated: "{}"',

    [ERROR_CODE.ORGANIZATION_LIMIT_EXCEED]: 'Organization limit exceed, has: "{}", max: "{}"',

    [ERROR_CODE.CANNOT_MODIFY_INTERNAL_GROUP]: 'Internal group cannot be modify',

    [ERROR_CODE.NOT_ENOUGH_PERMISSION]: 'Permission insufficient, need "{}"',
    [ERROR_CODE.PERMISSION_USER_DOES_NOT_MATCH]: 'Permission user does not match between: "{}" and "{}"',

    [ERROR_CODE.INTERNAL_ERROR]: 'Internal Error',
};

export const panic: Panic<ERROR_CODE> = Panic.withDictionary(MODULE_NAME, ERROR_LIST);
export const getErrorCreationFunction = (): ErrorCreationFunction => Connor.getErrorCreator(MODULE_NAME);

