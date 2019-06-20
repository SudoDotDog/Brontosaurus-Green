/**
 * @author WMXPY
 * @namespace Brontosaurus_Square_Util
 * @description Conf
 * @package Unit Test
 */

import { expect } from 'chai';
import * as Chance from "chance";
import { isDevelopment } from '../../../src/util/conf';

describe('Given [Conf] Helper Methods', (): void => {

    const chance: Chance.Chance = new Chance('brontosaurus-square-util-conf');

    it('should be able to find is development', (): void => {

        const isDev: boolean = isDevelopment();

        // tslint:disable-next-line
        expect(isDev).to.be.false;
    });
});
