'use strict';

var debug = require('debug')('cnpmjs.org:controllers:sync');
var Log = require('../services/module_log');
var npmService = require('../services/npm');
var SyncModuleWorker = require('./sync_module_worker');
var config = require('../config');

exports.sync = function* () {
  var username = this.user.name || 'anonymous';
  var name = this.params.name || this.params[0];
  var type = 'package';
  if (name.indexOf(':') > 0) {
    // user:fengmk2
    // package:pedding
    var splits = name.split(':');
    type = splits[0];
    name = splits[1];
  }
  var publish = this.query.publish === 'true';
  var noDep = this.query.nodeps === 'true';
  var syncUpstreamFirst = this.query.sync_upstream === 'true';
  var syncFromBackupFile = this.query.sync_from_backup === 'true';
  if (!config.enableWebDataRemoteRegistry && !config.sourceNpmRegistryIsCNpm) {
    syncUpstreamFirst = false;
  }
  debug('sync %s with query: %j, syncUpstreamFirst: %s', name, this.query, syncUpstreamFirst);
  if (type === 'package' && publish && !this.user.isAdmin) {
    this.status = 403;
    const error = '[no_perms] Only admin can publish';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  var options = {
    type: type,
    publish: publish,
    noDep: noDep,
    syncUpstreamFirst: syncUpstreamFirst,
    syncFromBackupFile: syncFromBackupFile,
  };

  var logId = yield SyncModuleWorker.sync(name, username, options);
  debug('sync %s got log id %j', name, logId);

  this.status = 201;
  this.body = {
    ok: true,
    logId: logId
  };
};

exports.scopeSync = function* () {
  var scope = this.params.scope;

  var scopeConfig = (config.syncScopeConfig || []).find(function (item) {
    return item.scope === scope
  })

  if (!scopeConfig) {
    this.status = 404;
    this.body = {
      error: 'no_scope',
      reason: 'only has syncScopeConfig config can use this feature'
    };
    return;
  }

  var scopeCnpmWeb = scopeConfig.sourceCnpmWeb
  var scopeCnpmRegistry = scopeConfig.sourceCnpmRegistry
  var packages = yield npmService.getScopePackagesShort(scope, scopeCnpmWeb)

  debug('scopeSync %s with query: %j', scope, this.query);

  var packageSyncWorkers = []

  for (let i = 0; i < packages.length; i++) {
    packageSyncWorkers.push(function* () {
      var name = packages[i]
      var logId = yield SyncModuleWorker.sync(name, 'admin', {
        type: 'package',
        publish: true,
        noDep: true,
        syncUpstreamFirst: false,
        syncPrivatePackage: { [scope]: scopeCnpmRegistry }
      })
      return { name: name, logId: logId }
    })
  }

  var logIds = yield packageSyncWorkers

  debug('scopeSync %s got log id %j', scope, logIds);

  this.status = 201;
  this.body = {
    ok: true,
    logIds: logIds
  };
};

exports.getSyncLog = function* (next) {
  var logId = Number(this.params.id || this.params[1]);
  var offset = Number(this.query.offset) || 0;

  if (!logId) { // NaN
    this.status = 404;
    return;
  }
  var row = yield Log.get(logId);
  if (!row) {
    return yield next;
  }

  var log = row.log.trim();
  var syncDone = row.log.indexOf('[done] Sync') >= 0;
  if (offset > 0) {
    log = log.split('\n').slice(offset).join('\n');
    if (!log && syncDone) {
      // append the last 1k string
      // the cnpm client sync need the `[done] Sync {name}` string to detect when sync task finished
      log = '... ignore long logs ...\n' + row.log.substring(row.log.length - 1024);
    }
  }
  this.body = { ok: true, syncDone: syncDone, log: log };
};
