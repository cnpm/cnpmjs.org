/*!
 * cnpmjs.org - sync/sync_all.js
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

var debug = require('debug')('cnpmjs.org:sync:sync_all');
var eventproxy = require('eventproxy');
var ms = require('ms');
var utility = require('utility');
var config = require('../config');
var Status = require('./status');
var Npm = require('../proxy/npm');
var Total = require('../proxy/total');
var SyncModuleWorker = require('../proxy/sync_module_worker');
var Module = require('../proxy/module');
var co = require('co');

function subtract(subtracter, minuend) {
  subtracter = subtracter || [];
  minuend = minuend || [];
  var map = {};
  var results = [];
  minuend.forEach(function (name) {
    map[name] = true;
  });
  subtracter.forEach(function (name) {
    if (!map[name]) {
      results.push(name);
    }
  });
  return results;
}

function union(arrOne, arrTwo) {
  arrOne = arrOne || [];
  arrTwo = arrTwo || [];
  var map = {};
  arrOne.concat(arrTwo).forEach(function (name) {
    map[name] = true;
  });
  return Object.keys(map);
}

/**
 * when sync from official at the first time
 * get all packages by short and restart from last synced module
 * @param {String} lastSyncModule
 */
function *getFirstSyncPackages(lastSyncModule) {
  var pkgs = yield Npm.getShort();
  if (!lastSyncModule) {
    return pkgs;
  }
  // start from last success
  var lastIndex = pkgs.indexOf(lastSyncModule);
  if (lastIndex > 0) {
    return pkgs.slice(lastIndex);
  }
}

/**
 * get all the packages that update time > lastSyncTime
 * @param {Number} lastSyncTime
 */
function *getCommonSyncPackages(lastSyncTime) {
  var data = yield Npm.getAllSince(lastSyncTime);
  if (!data) {
    return [];
  }
  delete data._updated;
  return Object.keys(data);
}

/**
 * get all the missing packages
 * @param {Function} callback
 */
function *getMissPackages(callback) {
  var r = yield [Npm.getShort(), Module.listAllModuleNames];
  var allPackages = r[0];
  var existPackages = r[1].map(function (row) {
    return row.name;
  });
  return subtract(allPackages, existPackages);
}

function *sync() {
  var syncTime = Date.now();
  var info = yield Total.getTotalInfo();
  if (!info) {
    throw new Error('can not found total info');
  }

  var packages;
  debug('Last sync time %s', new Date(info.last_sync_time));
  if (!info.last_sync_time) {
    debug('First time sync all packages from official registry');
    packages = yield getFirstSyncPackages(info.last_sync_module);
  } else {
    packages = yield getCommonSyncPackages(info.last_sync_time - ms('10m'));
  }

  packages = packages || [];
  var worker = new SyncModuleWorker({
    username: 'admin',
    name: packages,
    noDep: true,
    concurrency: config.syncConcurrency,
  });
  // Status.init({
  //   worker: worker,
  //   need: packages.length
  // }).start();
  worker.start();
  worker.once('end', function () {
    debug('All packages sync done, successes %d, fails %d',
      worker.successes.length, worker.fails.length);
    //only when all succss, set last sync time
    !worker.fails.length && Total.setLastSyncTime(syncTime, utility.noop);
    callback(null, {
      successes: worker.successes,
      fails: worker.fails
    });
  });
}
module.exports = function sync(callback) {
  var ep = eventproxy.create();
  ep.fail(callback);
  var syncTime = Date.now();
  Total.getTotalInfo(ep.doneLater('totalInfo'));

  ep.once('totalInfo', function (info) {
    if (!info) {
      return callback(new Error('can not found total info'));
    }
    debug('Last sync time %s', new Date(info.last_sync_time));
    // TODO: 记录上次同步的最后一个模块名称
    if (!info.last_sync_time) {
      debug('First time sync all packages from official registry');
      return getFirstSyncPackages(info.last_sync_module, ep.done('syncPackages'));
    }
    if (syncNotExist) {
      getMissPackages(ep.done('missPackages'));
      syncNotExist = false;
    } else {
      ep.emitLater('missPackages', []);
    }
    getCommonSyncPackages(info.last_sync_time - ms('10m'), ep.doneLater('newestPackages'));
    ep.all('missPackages', 'newestPackages', function (missPackages, newestPackages) {
      ep.emit('syncPackages', union(missPackages, newestPackages));
    });
  });

  ep.once('syncPackages', function (packages) {
    packages = packages || [];
    debug('Total %d packages to sync', packages.length);
    var worker = new SyncModuleWorker({
      username: 'admin',
      name: packages,
      noDep: true,
      concurrency: config.syncConcurrency,
    });
    Status.init({
      worker: worker,
      need: packages.length
    }).start();
    worker.start();
    worker.once('end', function () {
      debug('All packages sync done, successes %d, fails %d',
        worker.successes.length, worker.fails.length);
      //only when all succss, set last sync time
      !worker.fails.length && Total.setLastSyncTime(syncTime, utility.noop);
      callback(null, {
        successes: worker.successes,
        fails: worker.fails
      });
    });
  });
};
