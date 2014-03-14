/**!
 * cnpmjs.org - controllers/download.js
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

var Log = require('../proxy/module_log');
var SyncModuleWorker = require('../proxy/sync_module_worker');

exports.sync = function *() {
  var session = yield *this.session;
  var username = session.name || 'anonymous';
  var name = this.params.name;
  var publish = this.query.publish === 'true';
  var noDep = this.query.nodeps === 'true';
  if (publish && !session.isAdmin) {
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

  // friendly 404 reason info
  if (result.staticCache === 404) {
    this.status = 404;
    this.body = {
      ok: false,
      reason: 'can not found ' + name + ' in the source registry'
    };
    return;
  }
  if (!result.ok) {
    this.status = result.statusCode;
    this.body = result.pkg;
    return;
  }
  this.status = 201;
  this.body = {
    ok: true,
    logId: result.logId
  };
};

exports.getSyncLog = function *(next) {
  var logId = this.params.id;
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
