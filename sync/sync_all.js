'use strict';

var thunkify = require('thunkify-wrap');
var config = require('../config');
var Status = require('./status');
var npmService = require('../services/npm');
var totalService = require('../services/total');
var SyncModuleWorker = require('../controllers/sync_module_worker');
var logger = require('../common/logger');

/**
 * when sync from official at the first time
 * get all packages by short and restart from last synced module
 * @param {String} lastSyncModule
 */
function* getFirstSyncPackages(lastSyncModule) {
  var pkgs = yield npmService.getShort();
  if (!lastSyncModule) {
    return pkgs;
  }
  // start from last success
  var lastIndex = pkgs.indexOf(lastSyncModule);
  if (lastIndex > 0) {
    return pkgs.slice(lastIndex);
  }
}

module.exports = function* sync() {
  var syncTime = Date.now();
  var info = yield totalService.getTotalInfo();
  if (!info) {
    throw new Error('can not found total info');
  }

  var packages;
  logger.syncInfo('Last sync time %s', new Date(info.last_sync_time));
  if (!info.last_sync_time) {
    logger.syncInfo('First time sync all packages from official registry');
    packages = yield getFirstSyncPackages(info.last_sync_module);
  } else {
    var result = yield npmService.fetchUpdatesSince(info.last_sync_time);
    syncTime = result.lastModified;
    packages = result.names;
  }

  packages = packages || [];
  if (!packages.length) {
    logger.syncInfo('no packages need be sync');
    return;
  }
  logger.syncInfo('Total %d packages to sync: %j', packages.length, packages);

  var worker = new SyncModuleWorker({
    username: 'admin',
    name: packages,
    noDep: true,
    concurrency: config.syncConcurrency,
    syncUpstreamFirst: false,
  });
  Status.init({
    need: packages.length,
  }, worker);
  worker.start();
  var end = thunkify.event(worker);
  yield end();

  logger.syncInfo('All packages sync done, successes %d, fails %d, updates %d',
      worker.successes.length, worker.fails.length, worker.updates.length);
  // only when all succss, set last sync time
  // or successes > 1000
  if (!worker.fails.length || worker.successes.length > 1000) {
    yield totalService.setLastSyncTime(syncTime);
  }
  return {
    successes: worker.successes,
    fails: worker.fails,
    updates: worker.updates,
  };
};
