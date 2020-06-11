/**
 * @author WMXPY
 * @namespace Brontosaurus_Green_Util
 * @description Conf
 * @package Unit Test
 */

import { expect } from 'chai';
import * as Chance from "chance";
import { isDevelopment } from '../../../src/util/conf';

describe('Given [Conf] Helper Methods', (): void => {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const chance: Chance.Chance = new Chance('brontosaurus-square-util-conf');

    it('should be able to find is development', (): void => {

        const isDev: boolean = isDevelopment();

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(isDev).to.be.false;
    });
});
