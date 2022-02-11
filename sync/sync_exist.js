'use strict';

var debug = require('debug')('cnpmjs.org:sync:sync_exist');
var Status = require('./status');
var thunkify = require('thunkify-wrap');
var config = require('../config');
var npmService = require('../services/npm');
var packageService = require('../services/package');
var totalService = require('../services/total');
var Status = require('./status');
var SyncModuleWorker = require('../controllers/sync_module_worker');

function intersection(arrOne, arrTwo) {
  arrOne = arrOne || [];
  arrTwo = arrTwo || [];
  var map = {};
  var results = [];
  arrOne.forEach(function (name) {
    map[name] = true;
  });
  arrTwo.forEach(function (name) {
    map[name] === true && results.push(name);
  });
  return results;
}

module.exports = function* sync() {
  var syncTime = Date.now();

  var r = yield [packageService.listAllPublicModuleNames(), totalService.getTotalInfo()];
  var existPackages = r[0];
  var info = r[1];
  if (!info) {
    throw new Error('can not found total info');
  }

  var lastSeq = info.last_exist_sync_time;
  if (lastSeq && lastSeq > 132897820073) {
    // ignore exists timestamp
    lastSeq = null;
  }
  if (!lastSeq) {
    lastSeq = yield npmService.getChangesUpdateSeq();
  }
  if (!lastSeq) {
    debug('no packages need be sync');
    return {
      successes: [],
      fails: []
    };
  }

  var updatesPackages = [];
  var changes = yield npmService.listChanges(lastSeq);
  changes.forEach(change => {
    updatesPackages.push(change.id);
    lastSeq = change.seq;
  });
  var packages = intersection(existPackages, updatesPackages);
  debug('Total %d packages to sync, top 10: %j', packages.length, packages.slice(0, 10));
  if (!packages.length) {
    yield totalService.setLastExistSyncTime(lastSeq);
    debug('no packages need be sync, lastSeq: %s, changes: %s', lastSeq, changes.length);
    return {
      successes: [],
      fails: []
    };
  }

  var worker = new SyncModuleWorker({
    username: 'admin',
    name: packages,
    concurrency: config.syncConcurrency,
    syncUpstreamFirst: false,
  });
  Status.init({need: packages.length}, worker);
  worker.start();
  var end = thunkify.event(worker);
  yield end();

  debug('All packages sync done, successes %d, fails %d, lastSeq: %s, changes: %s',
    worker.successes.length, worker.fails.length, lastSeq, changes.length);

  yield totalService.setLastExistSyncTime(lastSeq);
  return {
    successes: worker.successes,
    fails: worker.fails
  };
};
