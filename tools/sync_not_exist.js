/*!
 * cnpmjs.org - tools/sync_not_exist.js
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

var debug = require('debug')('cnpmjs.org:tools:sync_not_exist');
var SyncModuleWorker = require('../proxy/sync_module_worker');
var thunkify = require('thunkify-wrap');
var Module = require('../proxy/module');
var config = require('../config');
var Npm = require('../proxy/npm');
var utility = require('utility');
var co = require('co');

function subtraction(arrOne, arrTwo) {
  arrOne = arrOne || [];
  arrTwo = arrTwo || [];
  var map = {};
  var results = [];
  arrTwo.forEach(function (name) {
    map[name] = true;
  });
  arrOne.forEach(function (name) {
    !map[name] && results.push(name);
  });
  return results;
}

function *sync() {
  var syncTime = Date.now();

  var allExists = yield Module.listShort();
  var existPackages = allExists.map(function (p) {
    return p.name;
  });

  var allPackages = yield Npm.getShort();
  var packages = subtraction(allPackages, existPackages);
  if (!packages.length) {
    debug('no packages need be sync');
    return;
  }
  debug('Total %d packages to sync', packages.length);

  var worker = new SyncModuleWorker({
    username: 'admin',
    name: packages,
    concurrency: config.syncConcurrency
  });
  worker.start();
  var end = thunkify.event(worker);
  yield end();

  debug('All packages sync done, successes %d, fails %d',
    worker.successes.length, worker.fails.length);

  Total.setLastExistSyncTime(syncTime, utility.noop);
  return {
    successes: worker.successes,
    fails: worker.fails
  };
}

module.exports = sync;

if (!module.parent) {
  console.log('[tools/sync_not_exist.js] start sync not exist modules');
  co(sync)();
}
