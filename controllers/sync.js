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
  var username = this.session.name || 'anonymous';
  var name = this.params.name;
  var publish = this.query.publish === 'true';
  var noDep = this.query.nodeps === 'true';
  if (publish && !req.session.isAdmin) {
    this.statusCode = 403;
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

  if (!result.ok) {
    this.statusCode = result.statusCode;
    this.body = result.pkg;
    return;
  }
  this.statusCode = 201;
  this.body = {
    ok: true,
    logId: result.logId
  };
};

exports.getSyncLog = function *() {
  var logId = this.params.id;
  var name = this.params.name;
  var offset = Number(this.query.offset) || 0;
  var row = yield Log.get(logId);
  if (!row) {
    return this.throw(404);
  }

  var log = row.log.trim();
  if (offset > 0) {
    log = log.split('\n').slice(offset).join('\n');
  }
  this.body = {ok: true, log: log};
};
