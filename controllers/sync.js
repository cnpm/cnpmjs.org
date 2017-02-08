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

const debug = require('debug')('cnpmjs.org:controllers:sync');
const Log = require('../services/module_log');
const SyncModuleWorker = require('./sync_module_worker');
const config = require('../config');

exports.sync = function* () {
  const username = this.user.name || 'anonymous';
  let name = this.params.name || this.params[0];
  let type = 'package';
  if (name.indexOf(':') > 0) {
    // user:fengmk2
    // package:pedding
    const splits = name.split(':');
    type = splits[0];
    name = splits[1];
  }
  const publish = this.query.publish === 'true';
  const noDep = this.query.nodeps === 'true';
  debug('sync %s with query: %j', name, this.query);
  if (type === 'package' && publish && !this.user.isAdmin) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Only admin can publish',
    };
    return;
  }

  const options = {
    type,
    publish,
    noDep,
    syncUpstreamFirst: config.sourceNpmRegistryIsCNpm,
  };

  const logId = yield SyncModuleWorker.sync(name, username, options);
  debug('sync %s got log id %j', name, logId);

  this.status = 201;
  this.body = {
    ok: true,
    logId,
  };
};

exports.getSyncLog = function* (next) {
  const logId = Number(this.params.id || this.params[1]);
  const offset = Number(this.query.offset) || 0;

  if (!logId) { // NaN
    this.status = 404;
    return;
  }
  const row = yield Log.get(logId);
  if (!row) {
    return yield next;
  }

  let log = row.log.trim();
  if (offset > 0) {
    log = log.split('\n').slice(offset).join('\n');
  }
  this.body = { ok: true, log };
};
