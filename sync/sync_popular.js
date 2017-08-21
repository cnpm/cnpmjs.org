'use strict';

var debug = require('debug')('cnpmjs.org:sync:sync_popular');
var thunkify = require('thunkify-wrap');
var config = require('../config');
var npmService = require('../services/npm');
var Status = require('./status');
var SyncModuleWorker = require('../controllers/sync_module_worker');
var logger = require('../common/logger');

module.exports = function* syncPopular() {
  var packages = yield npmService.getPopular(config.topPopular);
  packages = packages.map(function (r) {
    return r[0];
  });

  logger.syncInfo('Syncing %d popular packages, top 10: %j', packages.length, packages.slice(0, 10));

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
