'use strict';

var thunkify = require('thunkify-wrap');
const co = require('co');
const ms = require('humanize-ms');
var config = require('../config');
var npmService = require('../services/npm');
var SyncModuleWorker = require('../controllers/sync_module_worker');
var logger = require('../common/logger');


let syncing = false;
const syncFn = co.wrap(function*() {
  if (syncing) { return; }
  syncing = true;
  logger.syncInfo('Start syncing scope modules...');
  let data;
  let error;
  try {
    data = yield sync();
  } catch (err) {
    error = err;
    error.message += ' (sync package error)';
    logger.syncError(error);
  }

  if (data) {
    logger.syncInfo(data);
  }
  if (!config.debug) {
    sendMailToAdmin(error, data, new Date());
  }
  syncing = false;
});

syncFn().catch(onerror);
setInterval(() => syncFn().catch(onerror), ms(config.syncScopeInterval));

function onerror(err) {
  logger.error('====================== scope sync error ========================');
  logger.error(err);
}

function* getOtherCnpmDefineScopePackages(scopes) {
  var arr = []
  for (var i = 0; i < scopes.length; i++) {
    var packageList = yield* npmService.getScopePackagesShort(scopes[i].scope, scopes[i].sourceCnpmWeb)
    arr = arr.concat(packageList)
  }
  return arr
}

function* sync() {
  var scopeConfig = config.syncScopeConfig
  if (!scopeConfig || scopeConfig.length === 0) {
    process.exit(0);
  }
  var packages = yield* getOtherCnpmDefineScopePackages(scopeConfig);

  if (!packages.length) {
    return;
  }
  logger.syncInfo('Total %d scope packages to sync: %j', packages.length, packages);

  var worker = new SyncModuleWorker({
    username: 'admin',
    name: packages,
    noDep: true,
    syncUpstreamFirst: false,
    publish: true,
    concurrency: config.syncConcurrency,
    syncPrivatePackage: scopeConfig.reduce((arr, cur) => {
      arr[cur.scope] = cur.sourceCnpmRegistry
      return arr
    }, {})
  });
  worker.start();
  var end = thunkify.event(worker);
  yield end();

  logger.syncInfo('scope packages sync done, successes %d, fails %d, updates %d',
      worker.successes.length, worker.fails.length, worker.updates.length);

  return {
    successes: worker.successes,
    fails: worker.fails,
    updates: worker.updates,
  };
};
