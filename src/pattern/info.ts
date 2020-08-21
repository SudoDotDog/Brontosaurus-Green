/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Pattern
 * @description Info
 */

import { createBooleanPattern, createNumberPattern, createRecordPattern, createStringPattern, Pattern } from "@sudoo/pattern";

export const createBasicsPattern = (): Pattern => {

    return {
        type: 'or',
        options: [
            createStringPattern(),
            createNumberPattern(),
            createBooleanPattern(),
        ]
    };
};

export const createInfoPattern = (): Pattern => {

    return {
        type: 'or',
        options: [
            createStringPattern(),
            createRecordPattern(
                createStringPattern(),
                createBasicsPattern(),
            ),
        ],
    };
};
