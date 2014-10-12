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

var config = require('../config');
var Npm = require('../proxy/npm');
var Module = require('../proxy/module');
var Total = require('../services/total');
var SyncModuleWorker = require('../proxy/sync_module_worker');
var debug = require('debug')('cnpmjs.org:sync:sync_exist');
var utility = require('utility');
var Status = require('./status');
var ms = require('ms');
var thunkify = require('thunkify-wrap');

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

  var r = yield [Module.listShort(), Total.getTotalInfo()];
  var existPackages = r[0].map(function (p) {
    return p.name;
  });
  var info = r[1];
  if (!info) {
    throw new Error('can not found total info');
  }

  var allPackages;
  if (!info.last_exist_sync_time) {
    debug('First time sync all packages from official registry');
    var pkgs = yield Npm.getShort();

    if (info.last_sync_module) {
      // start from last success
      var lastIndex = pkgs.indexOf(info.last_sync_module);
      if (lastIndex > 0) {
        pkgs = pkgs.slice(lastIndex);
      }
    }
    allPackages = pkgs;
  } else {
    debug('sync new module from last exist sync time: %s', info.last_sync_time);
    var data = yield Npm.getAllSince(info.last_exist_sync_time - ms('10m'));
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
    return;
  }
  debug('Total %d packages to sync', packages.length);

  var worker = new SyncModuleWorker({
    username: 'admin',
    name: packages,
    concurrency: config.syncConcurrency
  });
  Status.init({need: packages.length}, worker);
  worker.start();
  var end = thunkify.event(worker);
  yield end();

  debug('All packages sync done, successes %d, fails %d',
    worker.successes.length, worker.fails.length);

  yield* Total.setLastExistSyncTime(syncTime);
  return {
    successes: worker.successes,
    fails: worker.fails
  };
};
