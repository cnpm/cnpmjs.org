/**!
 * cnpmjs.org - sync/index.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:sync:index');
var co = require('co');
var ms = require('humanize-ms');
var util = require('util');
var config = require('../config');
var mail = require('../common/mail');
var logger = require('../common/logger');
var totalService = require('../services/total');
var DistSyncer = require('./sync_dist');

var sync = null;

switch (config.syncModel) {
case 'all':
  sync = require('./sync_all');
  break;
case 'exist':
  sync = require('./sync_exist');
  break;
}

if (!sync && config.enableCluster) {
  console.log('[%s] [sync_worker:%s] no need to sync, exit now', Date(), process.pid);
  process.exit(0);
}

console.log('[%s] [sync_worker:%s] syncing with %s mode',
  Date(), process.pid, config.syncModel);

//set sync_status = 0 at first
co(function* () {
  yield* totalService.updateSyncStatus(0);
})(function (err) {
  if (err) {
    logger.error(err);
  }
});

var syncInterval = ms(config.syncInterval);
var minSyncInterval = ms('5m');
if (!syncInterval || syncInterval < minSyncInterval) {
  syncInterval = minSyncInterval;
}

// the same time only sync once
var syncing = false;
var handleSync = co(function* () {
  debug('mode: %s, syncing: %s', config.syncModel, syncing);
  if (!syncing) {
    syncing = true;
    debug('start syncing');
    var data;
    var error;
    try {
      data = yield* sync();
    } catch (err) {
      error = err;
      error.message += ' (sync package error)';
      logger.syncError(error);
    }
    data && logger.syncInfo(data);
    if (!config.debug) {
      sendMailToAdmin(error, data, new Date());
    }
    syncing = false;
  }
});

if (sync) {
  handleSync();
  setInterval(handleSync, syncInterval);
}

/**
 * sync dist(node.js and phantomjs)
 */

var syncingDist = false;
var syncDist = co(function* () {
  if (syncingDist) {
    return;
  }
  syncingDist = true;
  logger.syncInfo('Start syncing dist...');
  var distSyncer = new DistSyncer({
    disturl: config.disturl
  });
  try {
    yield* distSyncer.start();
    yield* distSyncer.syncPhantomjsDir();
  } catch (err) {
    err.message += ' (sync dist error)';
    logger.syncError(err);
    if (config.noticeSyncDistError) {
      sendMailToAdmin(err, null, new Date());
    }
  }
  syncingDist = false;
});

if (config.syncDist) {
  syncDist();
  setInterval(syncDist, syncInterval);
} else {
  logger.syncInfo('sync dist disable');
}

/**
 * sync python dist
 */

var syncingPythonDist = false;
var syncPythonDist = co(function* () {
  if (syncingPythonDist) {
    return;
  }
  syncingPythonDist = true;
  logger.syncInfo('Start syncing python dist...');
  var distSyncer = new DistSyncer({
    disturl: config.pythonDisturl
  });
  try {
    yield* distSyncer.start();
  } catch (err) {
    err.message += ' (sync python dist error)';
    logger.syncError(err);
    if (config.noticeSyncDistError) {
      sendMailToAdmin(err, null, new Date());
    }
  }
  syncingPythonDist = false;
});

if (config.syncPythonDist) {
  syncPythonDist();
  setInterval(syncPythonDist, syncInterval);
} else {
  logger.syncInfo('sync python dist disable');
}

/**
 * sync popular modules
 */

var syncingPopular = false;
var syncPopular = co(function* syncPopular() {
  if (syncingPopular) {
    return;
  }
  syncingPopular = true;
  logger.syncInfo('Start syncing popular modules...');
  var data;
  var error;
  try {
    data = yield* require('./sync_popular');
  } catch (err) {
    error = err;
    error.message += ' (sync package error)';
    logger.syncError(error);
  }

  if (data) {
    logger.syncInfo(data);
  }
  if (!config.debug) {
    sendMailToAdmin(error, data, new Date());
  }

  syncingPopular = false;
});

if (config.syncPopular) {
  syncPopular();
  setInterval(syncPopular, ms(config.syncPopularInterval));
} else {
  logger.syncInfo('sync popular module disable');
}

function sendMailToAdmin(err, result, syncTime) {
  result = result || {};
  var to = [];
  for (var name in config.admins) {
    to.push(config.admins[name]);
  }
  debug('Send email to all admins: %j, with err message: %s, result: %j, start sync time: %s.',
    to, err ? err.message : '', result, syncTime);
  var subject;
  var type;
  var html;
  if (err) {
    subject = 'Sync Error';
    type = 'error';
    html = util.format('Sync packages from official registry failed.\n' +
      'Start sync time is %s.\nError message is %s: %s\n%s.', syncTime, err.name, err.message, err.stack);
  } else if (result.fails && result.fails.length) {
    subject = 'Sync Finished But Some Packages Failed';
    type = 'warn';
    html = util.format('Sync packages from official registry finished, but some packages sync failed.\n' +
      'Start sync time is %s.\n %d packges sync failed: %j ...\n %d packages sync successes :%j ...',
      syncTime, result.fails.length, result.fails.slice(0, 10),
      result.successes.length, result.successes.slice(0, 10));
  } else if (result.successes && result.successes.length) {
    subject = 'Sync Finished';
    type = 'log';
    html = util.format('Sync packages from official registry finished.\n' +
      'Start sync time is %s.\n %d packages sync successes :%j ...',
      syncTime, result.successes.length, result.successes.slice(0, 10));
  }
  debug('send email with type: %s, subject: %s, html: %s', type, subject, html);
  logger.syncInfo('send email with type: %s, subject: %s, html: %s', type, subject, html);
  if (type && type !== 'log') {
    mail[type](to, subject, html, function (err) {
      if (err) {
        logger.error(err);
      }
    });
  }
}
