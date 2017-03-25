'use strict';

const debug = require('debug')('cnpmjs.org:sync:index');
const co = require('co');
const ms = require('humanize-ms');
const util = require('util');
const config = require('../config');
const mail = require('../common/mail');
const logger = require('../common/logger');
const totalService = require('../services/total');

let sync = null;

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

console.log('[%s] [sync_worker:%s] syncing with %s mode, changesStreamingSync: %s',
  Date(), process.pid, config.syncModel, config.changesStreamingSync);

function onerror(err) {
  logger.error(err);
}

// set sync_status = 0 at first
co(function* () {
  yield totalService.updateSyncStatus(0);
  yield checkSyncStatus();
}).catch(onerror);

let syncInterval = ms(config.syncInterval);
const minSyncInterval = ms('5m');
if (!syncInterval || syncInterval < minSyncInterval) {
  syncInterval = minSyncInterval;
}

if (sync) {
  // the same time only sync once
  let syncing = false;
  const syncFn = co.wrap(function*() {
    debug('mode: %s, syncing: %s', config.syncModel, syncing);
    if (!syncing) {
      syncing = true;
      debug('start syncing');
      let data;
      let error;
      try {
        data = yield sync();
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

    // check last_sync_time and last_exist_sync_time
    yield checkSyncStatus();
  });

  syncFn().catch(onerror);
  setInterval(() => syncFn().catch(onerror), syncInterval);
}

/**
 * sync popular modules
 */

if (config.syncPopular) {
  const sync = require('./sync_popular');
  let syncing = false;
  const syncFn = co.wrap(function*() {
    if (syncing) {
      return;
    }
    syncing = true;
    logger.syncInfo('Start syncing popular modules...');
    let data;
    let error;
    try {
      data = yield sync();
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
    syncing = false;
  });

  syncFn().catch(onerror);
  setInterval(() => syncFn().catch(onerror), ms(config.syncPopularInterval));
}

if (config.syncChangesStream) {
  const sync = require('./changes_stream_syncer');
  let syncing = false;
  const syncFn = co.wrap(function*() {
    if (syncing) {
      return;
    }
    syncing = true;
    logger.syncInfo('Start changes stream syncing...');
    try {
      yield sync();
    } catch (err) {
      err.message += ' (sync changes stream error)';
      logger.syncError(err);
    }
    syncing = false;
  });

  syncFn().catch(onerror);
  setInterval(() => syncFn().catch(onerror), ms('1m'));
}

function sendMailToAdmin(err, result, syncTime) {
  result = result || {};
  const to = [];
  for (var name in config.admins) {
    to.push(config.admins[name]);
  }
  debug('Send email to all admins: %j, with err message: %s, result: %j, start sync time: %s.',
    to, err ? err.message : '', result, syncTime);
  let subject;
  let type;
  let html;
  if (err) {
    // ignore 503, 504 error
    // 504: Gateway Time-out
    // 502 Bad Gateway
    if (err.status === 503 || err.status === 504 || err.status === 502) {
      return;
    }
    if (err.name === 'JSONResponseFormatError') {
      return;
    }
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
    // skip email notice when fails items small then 3
    if (result.fails.length < 3) {
      type = 'log';
    }
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
    mail[type](to, subject, html, err => {
      if (err) {
        logger.error(err);
      }
    });
  }
}

function* checkSyncStatus() {
  // if source registry not cnpm, ignore it. e.g.: cnpmjs.org source registry is npmjs.org
  if (!config.sourceNpmRegistryIsCNpm) {
    return;
  }
  const total = yield totalService.getTotalInfo();
  let lastSyncTime;
  if (config.syncModel === 'all') {
    lastSyncTime = total.last_sync_time;
  } else if (config.syncModel === 'exist') {
    lastSyncTime = total.last_exist_sync_time;
  }
  debug('checkSyncStatus start, lastSyncTime: %s, syncInterval: %s', lastSyncTime, syncInterval);
  if (!lastSyncTime) {
    return;
  }
  const diff = Date.now() - lastSyncTime;
  const oneDay = 3600000 * 24;
  const maxTime = Math.max(oneDay, syncInterval * 2);
  if (diff > maxTime) {
    const err = new Error('Last sync time is expired in ' + diff + ' ms, lastSyncTime: ' +
      new Date(lastSyncTime) + ', maxTime: ' + maxTime + ' ms');
    err.name = 'SyncExpiredError';
    sendMailToAdmin(err, null, new Date());
  }
}
