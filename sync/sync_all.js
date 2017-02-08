'use strict';

const thunkify = require('thunkify-wrap');
const config = require('../config');
const Status = require('./status');
const npmService = require('../services/npm');
const totalService = require('../services/total');
const SyncModuleWorker = require('../controllers/sync_module_worker');
const logger = require('../common/logger');

/**
 * when sync from official at the first time
 * get all packages by short and restart from last synced module
 * @param {String} lastSyncModule - last sync module name
 * @return {Array} module names
 */
function* getFirstSyncPackages(lastSyncModule) {
  const pkgs = yield npmService.getShort();
  if (!lastSyncModule) {
    return pkgs;
  }
  // start from last success
  const lastIndex = pkgs.indexOf(lastSyncModule);
  if (lastIndex > 0) {
    return pkgs.slice(lastIndex);
  }
}

module.exports = function* sync() {
  let syncTime = Date.now();
  const info = yield totalService.getTotalInfo();
  if (!info) {
    throw new Error('can not found total info');
  }

  let packages;
  logger.syncInfo('Last sync time %s', new Date(info.last_sync_time));
  if (!info.last_sync_time) {
    logger.syncInfo('First time sync all packages from official registry');
    packages = yield getFirstSyncPackages(info.last_sync_module);
  } else {
    const result = yield npmService.fetchUpdatesSince(info.last_sync_time);
    syncTime = result.lastModified;
    packages = result.names;
  }

  packages = packages || [];
  if (!packages.length) {
    logger.syncInfo('no packages need be sync');
    return;
  }
  logger.syncInfo('Total %d packages to sync: %j', packages.length, packages);

  const worker = new SyncModuleWorker({
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
  const end = thunkify.event(worker);
  yield end();

  logger.syncInfo('All packages sync done, successes %d, fails %d, updates %d',
      worker.successes.length, worker.fails.length, worker.updates.length);
  // only when all succss, set last sync time
  if (!worker.fails.length) {
    yield totalService.setLastSyncTime(syncTime);
  }
  return {
    successes: worker.successes,
    fails: worker.fails,
    updates: worker.updates,
  };
};
