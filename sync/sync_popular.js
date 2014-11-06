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

var debug = require('debug')('cnpmjs.org:sync:sync_popular');
var thunkify = require('thunkify-wrap');
var config = require('../config');
var npmService = require('../services/npm');
var Status = require('./status');
var SyncModuleWorker = require('../controllers/sync_module_worker');

module.exports = function* syncPopular() {
  var packages = yield* npmService.getPopular(config.topPopular);

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

  debug('All popular packages sync done, successes %d, fails %d',
    worker.successes.length, worker.fails.length);

  return {
    successes: worker.successes,
    fails: worker.fails
  };
};
