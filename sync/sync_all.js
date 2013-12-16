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
      return Npm.getShort(ep.done(function (pkgs) {
        if (!info.last_sync_module) {
          return ep.emit('allPackages', pkgs);
        }
        // start from last success
        var lastIndex = pkgs.indexOf(info.last_sync_module);
        if (lastIndex > 0) {
          pkgs = pkgs.slice(lastIndex);
        }
        ep.emit('allPackages', pkgs);
      }));
    }
    Npm.getAllSince(info.last_sync_time, ep.done(function (data) {
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

  ep.once('allPackages', function (packages) {
    packages = packages || [];
    debug('Total %d packages to sync', packages.length);
    var worker = new SyncModuleWorker({
      username: 'admin',
      name: packages,
      noDep: true
    });
    Status.init({
      worker: worker,
      need: packages.length
    }).start();
    worker.start();
    worker.once('end', function () {
      debug('All packages sync done, successes %d, fails %d',
        worker.successes.length, worker.fails.length);
      Total.setLastSyncTime(syncTime, utility.noop);
      callback(null, {
        successes: worker.successes,
        fails: worker.fails
      });
    });
  });
};
