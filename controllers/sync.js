'use strict';

var debug = require('debug')('cnpmjs.org:controllers:sync');
var Log = require('../services/module_log');
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
  if (!config.sourceNpmRegistryIsCNpm) {
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
  };

  var logId = yield SyncModuleWorker.sync(name, username, options);
  debug('sync %s got log id %j', name, logId);

  this.status = 201;
  this.body = {
    ok: true,
    logId: logId
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
