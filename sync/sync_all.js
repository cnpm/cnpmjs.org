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

var config = require('../config');
var Npm = require('../proxy/npm');
var Total = require('../proxy/total');
var eventproxy = require('eventproxy');
var SyncModuleWorker = require('../proxy/sync_module_worker');
var debug = require('debug')('cnpmjs.org:sync:sync_all');
var utility = require('utility');
var Status = require('./status');
var Module = require('../proxy/module');
var ms = require('ms');

function subtract(subtracter, minuend) {
  subtracter = subtracter || [];
  minuend = minuend || [];
  var map = {};
  var results = [];
  minuend.forEach(function (name) {
    map[name] = true;
  });
  subtracter.forEach(function (name) {
    !map[name] && results.push(name);
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
 * @param {Function} callback
 */
function getFirstSyncPackages(lastSyncModule, callback) {
  Npm.getShort(function (err, pkgs) {
    if (err || !lastSyncModule) {
      return callback(err, pkgs);
    }
    // start from last success
    var lastIndex = pkgs.indexOf(lastSyncModule);
    if (lastIndex > 0) {
      pkgs = pkgs.slice(lastIndex);
    }
    return callback(null, pkgs);
  });
}

/**
 * get all the packages that update time > lastSyncTime
 * @param {Number} lastSyncTime 
 * @param {Function} callback 
 */
function getCommonSyncPackages(lastSyncTime, callback) {
  Npm.getAllSince(lastSyncTime, function (err, data) {
    if (err || !data) {
      return callback(err, []);
    }
    delete data._updated;
    return callback(null, Object.keys(data));
  });
}

/**
 * get all the missing packages
 * @param {Function} callback
 */
function getMissPackages(callback) {
  var ep = eventproxy.create();
  ep.fail(callback);
  Npm.getShort(ep.doneLater('allPackages'));
  Module.listShort(ep.doneLater(function (rows) {
    var existPackages = rows.map(function (row) {
      return row.name;
    });
    ep.emit('existPackages', existPackages);
  }));
  ep.all('allPackages', 'existPackages', function (allPackages, existPackages) {
    callback(null, subtract(allPackages, existPackages));
  });
}

//only sync not exist once
var syncNotExist = true;
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
