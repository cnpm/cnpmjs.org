/*!
 * cnpmjs.org - sync/sync_popular.js
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

var SyncModuleWorker = require('../proxy/sync_module_worker');
var debug = require('debug')('cnpmjs.org:sync:sync_popular');
var thunkify = require('thunkify-wrap');
var config = require('../config');
var Npm = require('../proxy/npm');
var utility = require('utility');
var Status = require('./status');

module.exports = function *sync() {
  var syncTime = Date.now();

  var packages = yield Npm.getPopular(config.topPopular);

  var worker = new SyncModuleWorker({
    username: 'admin',
    name: packages,
    concurrency: config.syncConcurrency
  });
  Status.init({need: packages.length}, worker);
  worker.start();
  var end = thunkify.event(worker);
  yield end();

  debug('All popular packages sync done, successes %d, fails %d',
    worker.successes.length, worker.fails.length);

  return {
    successes: worker.successes,
    fails: worker.fails
  };
};
