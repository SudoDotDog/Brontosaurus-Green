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
import { getVersion } from './util/version';

const setting: SudooExpressApplication = SudooExpressApplication.create('Brontosaurus-Green', getVersion());

setting.useBodyParser();

if (isDevelopment()) {
    setting.allowCrossOrigin();
    SudooLog.global.level(LOG_LEVEL.VERBOSE);
    SudooLog.global.showTime();
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

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
app.host(8500);
SudooLog.global.critical('Hosting at 8500');
