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
var Log = require('../proxy/module_log');
var SyncModuleWorker = require('../proxy/sync_module_worker');

exports.sync = function* () {
  var username = this.user.name || 'anonymous';
  var name = this.params.name || this.params[0];
  var publish = this.query.publish === 'true';
  var noDep = this.query.nodeps === 'true';
  debug('sync %s with query: %j', name, this.query);
  if (publish && !this.user.isAdmin) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Only admin can publish'
    };
    return;
  }

  var options = {
    publish: publish,
    noDep: noDep,
  };

  var result = yield SyncModuleWorker.sync(name, username, options);
  debug('sync %s got %j', name, result);

  // friendly 404 reason info
  if (result.statusCode === 404) {
    this.status = 404;
    this.body = {
      ok: false,
      reason: 'can not found ' + name + ' in the source registry'
    };
    return;
  }
  if (!result.ok) {
    this.status = result.statusCode || 500;
    this.body = result.pkg;
    return;
  }
  this.status = 201;
  this.body = {
    ok: true,
    logId: result.logId
  };
};

exports.getSyncLog = function* (next) {
  // params: [$name, $id] on scope package
  var logId = this.params.id || this.params[1];
  var offset = Number(this.query.offset) || 0;
  var row = yield Log.get(logId);
  if (!row) {
    return yield* next;
  }

  var log = row.log.trim();
  if (offset > 0) {
    log = log.split('\n').slice(offset).join('\n');
  }
  this.body = {ok: true, log: log};
};
