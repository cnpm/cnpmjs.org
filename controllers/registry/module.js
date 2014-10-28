/**!
 * cnpmjs.org - controllers/registry/module.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:controllers:registry:module');
var config = require('../../config');
// var ModuleUnpublished = require('../../proxy/module_unpublished');
var packageService = require('../../services/package');
var userService = require('../../services/user');


// PUT /:name/-rev/:rev
// https://github.com/npm/npm-registry-client/blob/master/lib/unpublish.js#L63
exports.updateOrRemove = function* (next) {
  var name = this.params.name || this.params[0];
  debug('updateOrRemove module %s, %s, %j', this.url, name, this.request.body);

  var body = this.request.body;
  if (body.versions) {
    yield* exports.removeWithVersions.call(this, next);
  } else if (body.maintainers) {
    yield* exports.updateMaintainers.call(this, next);
  } else {
    yield* next;
  }
};

exports.listAllModules = function *() {
  var updated = Date.now();
  var mods = yield Module.listAllNames();
  var result = { _updated: updated };
  mods.forEach(function (mod) {
    result[mod.name] = true;
  });
  this.body = result;
};

var A_WEEK_MS = 3600000 * 24 * 7;

exports.listAllModulesSince = function *() {
  var query = this.query || {};
  if (query.stale !== 'update_after') {
    this.status = 400;
    this.body = {
      error: 'query_parse_error',
      reason: 'Invalid value for `stale`.'
    };
    return;
  }

  debug('list all modules from %s', query.startkey);
  var startkey = Number(query.startkey) || 0;
  var updated = Date.now();
  if (updated - startkey > A_WEEK_MS) {
    startkey = updated - A_WEEK_MS;
    console.warn('[%s] list modules since time out of range: query: %j, ip: %s',
      Date(), query, this.ip);
  }
  var mods = yield Module.listSince(startkey);
  var result = { _updated: updated };
  mods.forEach(function (mod) {
    result[mod.name] = true;
  });

  this.body = result;
};

exports.listAllModuleNames = function *() {
  this.body = (yield Module.listShort()).map(function (m) {
    return m.name;
  });
};
