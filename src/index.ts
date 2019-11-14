/**
 * @author WMXPY
 * @namespace Brontosaurus_Green
 * @description Index
 */

import { connect } from '@brontosaurus/db';
import { SudooExpress, SudooExpressApplication } from '@sudoo/express';
import { LOG_LEVEL, SudooLog } from '@sudoo/log';
import * as Mongoose from "mongoose";
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

const db: Mongoose.Connection = connect(config.database);
db.on('error', console.log.bind(console, 'connection error:'));

// Static
app.static(Path.join(__dirname, '..', 'public', 'air'));

// Routes
app.routeList(RouteList);

// Health
app.health('/health');

app.host(8500);
SudooLog.global.critical('Hosting at 8500');
