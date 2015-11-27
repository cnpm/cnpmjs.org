/**!
 * cnpmjs.org - controllers/sync.js
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
  debug('sync %s with query: %j', name, this.query);
  if (type === 'package' && publish && !this.user.isAdmin) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Only admin can publish'
    };
    return;
  }

  var options = {
    type: type,
    publish: publish,
    noDep: noDep,
    syncUpstreamFirst: config.sourceNpmRegistryIsCNpm,
  };

  var logId = yield* SyncModuleWorker.sync(name, username, options);
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
  var row = yield* Log.get(logId);
  if (!row) {
    return yield* next;
  }

  var log = row.log.trim();
  if (offset > 0) {
    log = log.split('\n').slice(offset).join('\n');
  }
  this.body = {ok: true, log: log};
};
