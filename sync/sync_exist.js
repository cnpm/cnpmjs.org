/*!
 * cnpmjs.org - sync/sync_exist.js
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

var debug = require('debug')('cnpmjs.org:sync:sync_exist');
var Status = require('./status');
var ms = require('humanize-ms');
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
    map[name] && results.push(name);
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

  var allPackages;
  if (!info.last_exist_sync_time) {
    var pkgs = yield* npmService.getShort();
    debug('First time sync all packages from official registry, got %d packages', pkgs.length);
    if (info.last_sync_module) {
      // start from last success
      var lastIndex = pkgs.indexOf(info.last_sync_module);
      if (lastIndex > 0) {
        pkgs = pkgs.slice(lastIndex);
        debug('recover from %d: %s', lastIndex, info.last_sync_module);
      }
    }
    allPackages = pkgs;
  } else {
    debug('sync new module from last exist sync time: %s', info.last_sync_time);
    var data = yield* npmService.getAllSince(info.last_exist_sync_time - ms('10m'));
    if (!data) {
      allPackages = [];
    }
    if (data._updated) {
      syncTime = data._updated;
      delete data._updated;
    }
    allPackages = Object.keys(data);
  }

  var packages = intersection(existPackages, allPackages);
  if (!packages.length) {
    debug('no packages need be sync');
    return {
      successes: [],
      fails: []
    };
  }
  debug('Total %d packages to sync', packages.length);

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

  debug('All packages sync done, successes %d, fails %d',
    worker.successes.length, worker.fails.length);

  yield* totalService.setLastExistSyncTime(syncTime);
  return {
    successes: worker.successes,
    fails: worker.fails
  };
};
