/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Util
 * @description Error
 */

import { Connor, Panic } from 'connor';

export const MODULE_NAME = 'Brontosaurus-Green';

export enum ERROR_CODE {

    TOKEN_INVALID = 4106,
    TOKEN_EXPIRED = 4107,

    APPLICATION_KEY_NOT_FOUND = 4120,
    APPLICATION_GREEN_NOT_VALID = 4121,

    ACCOUNT_ORGANIZATION_NOT_FOUND = 4135,

    TOKEN_DOES_NOT_CONTAIN_INFORMATION = 4150,
    TOKEN_DOES_NOT_CONTAIN_HEADER = 4151,
    TOKEN_DOES_NOT_CONTAIN_BODY = 4152,
    TOKEN_DOES_NOT_CONTAIN_ORGANIZATION = 4153,

    INSUFFICIENT_INFORMATION = 4500,
    INSUFFICIENT_SPECIFIC_INFORMATION = 4501,

    INFO_LINE_FORMAT_ERROR = 4506,

    REQUEST_DOES_MATCH_PATTERN = 5005,
    REQUEST_FORMAT_ERROR = 5006,

    APPLICATION_NOT_FOUND = 6200,
    GROUP_NOT_FOUND = 6201,
    ACCOUNT_NOT_FOUND = 6202,
    ORGANIZATION_NOT_FOUND = 6203,
}

export const ERROR_LIST: Record<ERROR_CODE, string> = {

    [ERROR_CODE.TOKEN_INVALID]: 'Token invalid',
    [ERROR_CODE.TOKEN_EXPIRED]: 'Token expired',

    [ERROR_CODE.APPLICATION_KEY_NOT_FOUND]: 'Application key not found',
    [ERROR_CODE.APPLICATION_GREEN_NOT_VALID]: 'Application green not valid',

    [ERROR_CODE.ACCOUNT_ORGANIZATION_NOT_FOUND]: 'Account organization not found',

    [ERROR_CODE.TOKEN_DOES_NOT_CONTAIN_INFORMATION]: 'Token does not contain information: "{}"',
    [ERROR_CODE.TOKEN_DOES_NOT_CONTAIN_HEADER]: 'Token does not contain header',
    [ERROR_CODE.TOKEN_DOES_NOT_CONTAIN_BODY]: 'Token does not contain body',
    [ERROR_CODE.TOKEN_DOES_NOT_CONTAIN_ORGANIZATION]: 'Token does not contain organization',

    [ERROR_CODE.INSUFFICIENT_INFORMATION]: 'Insufficient information',
    [ERROR_CODE.INSUFFICIENT_SPECIFIC_INFORMATION]: 'Insufficient information, need: "{}"',

    [ERROR_CODE.INFO_LINE_FORMAT_ERROR]: 'Info line: "{}" format error',

    [ERROR_CODE.REQUEST_DOES_MATCH_PATTERN]: 'Request does not match pattern',
    [ERROR_CODE.REQUEST_FORMAT_ERROR]: 'Request format error: "{}", should be: "{}", but: "{}"',

    [ERROR_CODE.APPLICATION_NOT_FOUND]: 'Application: "{}" not found',
    [ERROR_CODE.GROUP_NOT_FOUND]: 'Group: "{}" not found',
    [ERROR_CODE.ACCOUNT_NOT_FOUND]: 'Account: "{}" not found',
    [ERROR_CODE.ORGANIZATION_NOT_FOUND]: 'Organization: "{}" not found',
};

export const panic: Panic<ERROR_CODE> = Panic.withDictionary(MODULE_NAME, ERROR_LIST);
export const getErrorCreationFunction = () => Connor.getErrorCreator(MODULE_NAME);

