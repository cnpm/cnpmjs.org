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
var Total = require('../proxy/total');
var eventproxy = require('eventproxy');
var SyncModuleWorker = require('../proxy/sync_module_worker');
var debug = require('debug')('cnpmjs.org:sync:sync_hot');
var utility = require('utility');

function intersection(arrOne, arrTwo) {
  arrOne = arrOne || [];
  arrTwo = arrTwo || [];
  var map = {};
  var results = [];
  for (var i = 0; i < arrOne.length; i++) {
    map[arrOne[i]] = true;
  }
  for (var j = 0; j < arrTwo.length; j++) {
    map[arrTwo[j]] && results.push(arrTwo[j]);
  }
  return results;
}

module.exports = function sync(callback) {
  var ep = eventproxy.create();
  ep.fail(callback);
  var syncTime = Date.now();

  Module.listShort(ep.doneLater(function (packages) {
    packages = packages.map(function (p) {
      return p.name;
    });
    ep.emit('existPackages', packages);
  }));
  Total.getTotalInfo(ep.doneLater('totalInfo'));

  ep.once('totalInfo', function (info) {
    if (!info.last_exist_sync_time) {
      debug('First time sync all packages from official registry');
      return Npm.getShort(ep.done('allPackages'));
    }
    Npm.getAllSince(info.last_exist_sync_time, ep.done(function (data) {
      if (!data) {
        return ep.emit('allPackages', []);
      }
      if (data._updated) {
        syncTime = data._updated;
        delete data._updated;
      }

      return ep.emit('allPackages', Object.keys(data));
    }));
  });

  ep.all('existPackages', 'allPackages', function (existPackages, allPackages) {
    var packages = intersection(existPackages, allPackages);
    debug('Total %d packages to sync', packages.length);
    var worker = new SyncModuleWorker({
      username: 'admin',
      name: packages
    });
    worker.start();    
    worker.once('end', function () {
      debug('All packages sync done, successes %d, fails %d', 
        worker.successes.length, worker.fails.length);
      Total.setLastExistSyncTime(syncTime, utility.noop);
      callback(null, {
        successes: worker.successes,
        fails: worker.fails
      });
    });
  });
};
