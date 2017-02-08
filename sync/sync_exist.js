'use strict';

const debug = require('debug')('cnpmjs.org:sync:sync_exist');
const thunkify = require('thunkify-wrap');
const config = require('../config');
const npmService = require('../services/npm');
const packageService = require('../services/package');
const totalService = require('../services/total');
const Status = require('./status');
const SyncModuleWorker = require('../controllers/sync_module_worker');

function intersection(arrOne, arrTwo) {
  arrOne = arrOne || [];
  arrTwo = arrTwo || [];
  const map = {};
  const results = [];
  arrOne.forEach(function(name) {
    map[name] = true;
  });
  arrTwo.forEach(function(name) {
    map[name] === true && results.push(name);
  });
  return results;
}

module.exports = function* sync() {
  let syncTime = Date.now();

  const r = yield [ packageService.listAllPublicModuleNames(), totalService.getTotalInfo() ];
  const existPackages = r[0];
  const info = r[1];
  if (!info) {
    throw new Error('can not found total info');
  }

  let allPackages;
  if (!info.last_exist_sync_time) {
    let pkgs = yield npmService.getShort();
    debug('First time sync all packages from official registry, got %d packages', pkgs.length);
    if (info.last_sync_module) {
      // start from last success
      const lastIndex = pkgs.indexOf(info.last_sync_module);
      if (lastIndex > 0) {
        pkgs = pkgs.slice(lastIndex);
        debug('recover from %d: %s', lastIndex, info.last_sync_module);
      }
    }
    allPackages = pkgs;
  } else {
    debug('sync new module from last exist sync time: %s', info.last_exist_sync_time);
    const result = yield npmService.fetchUpdatesSince(info.last_exist_sync_time);
    allPackages = result.names;
    syncTime = result.lastModified;
  }

  const packages = intersection(existPackages, allPackages);
  if (!packages.length) {
    debug('no packages need be sync');
    return {
      successes: [],
      fails: [],
    };
  }
  debug('Total %d packages to sync, top 10: %j', packages.length, packages.slice(0, 10));

  const worker = new SyncModuleWorker({
    username: 'admin',
    name: packages,
    concurrency: config.syncConcurrency,
    syncUpstreamFirst: false,
  });
  Status.init({ need: packages.length }, worker);
  worker.start();
  const end = thunkify.event(worker);
  yield end();

  debug('All packages sync done, successes %d, fails %d',
    worker.successes.length, worker.fails.length);

  yield totalService.setLastExistSyncTime(syncTime);
  return {
    successes: worker.successes,
    fails: worker.fails,
  };
};
