'use strict';

const debug = require('debug')('cnpmjs.org:sync:sync_popular');
const thunkify = require('thunkify-wrap');
const config = require('../config');
const npmService = require('../services/npm');
const Status = require('./status');
const SyncModuleWorker = require('../controllers/sync_module_worker');
const logger = require('../common/logger');

module.exports = function* syncPopular() {
  let packages = yield npmService.getPopular(config.topPopular);
  packages = packages.map(function(r) {
    return r[0];
  });

  logger.syncInfo('Syncing %d popular packages, top 10: %j', packages.length, packages.slice(0, 10));

  const worker = new SyncModuleWorker({
    username: 'admin',
    name: packages,
    concurrency: config.syncConcurrency,
    syncUpstreamFirst: false,
  });

  Status.init({ need: packages.length }, worker);
  worker.start();
  const end = thunkify.event(worker);
  yield end();

  debug('All popular packages sync done, successes %d, fails %d',
    worker.successes.length, worker.fails.length);

  return {
    successes: worker.successes,
    fails: worker.fails,
  };
};
