/**
 * @author WMXPY
 * @namespace Brontosaurus_Green
 * @description Index
 */

import { connect } from '@brontosaurus/db';
import { SudooExpress, SudooExpressApplication } from '@sudoo/express';
import { LOG_LEVEL, SudooLog } from '@sudoo/log';
import * as Path from 'path';
import { RouteList } from './route/import';
import { BrontosaurusConfig, isDevelopment, readConfigEnvironment } from './util/conf';

const setting: SudooExpressApplication = SudooExpressApplication.create('Brontosaurus-Green', '1');

setting.useBodyParser();

if (isDevelopment()) {
    setting.allowCrossOrigin();
    SudooLog.global.level(LOG_LEVEL.VERBOSE);
} else {
    SudooLog.global.level(LOG_LEVEL.INFO);
}

const app: SudooExpress = SudooExpress.create(setting);

const config: BrontosaurusConfig = readConfigEnvironment();

connect(config.database, {
    connected: true,
    disconnected: true,
    error: true,
    reconnected: true,
    reconnectedFailed: true,
});

// Static
app.static(Path.join(__dirname, '..', 'public', 'air'));

// Routes
app.routeList(RouteList);

// Health
app.health('/health');

// tslint:disable-next-line: no-magic-numbers
app.host(8500);
SudooLog.global.critical('Hosting at 8500');
