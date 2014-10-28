/**!
 * cnpmjs.org - controllers/registry/package/remove.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:controllers:registry:package:remove');
var urlparse = require('url').parse;
var packageService = require('../../../services/package');
var totalService = require('../../../services/total');
var nfs = require('../../../common/nfs');
var common = require('./common');

module.exports = function* remove(next) {
  var name = this.params.name || this.params[0];
  var username = this.user.name;
  var rev = this.params.rev || this.params[1];
  debug('remove all the module with name: %s, id: %s', name, rev);

  var mods = yield* packageService.listModulesByName(name);
  debug('removeAll module %s: %d', name, mods.length);
  var mod = mods[0];
  if (!mod) {
    return yield* next;
  }

  var isMaintainerOrAdmin = yield* common.isMaintainerOrAdmin(name, this.user);
  if (!isMaintainerOrAdmin) {
    this.status = 403;
    this.body = {
      error: 'forbidden user',
      reason: username + ' not authorized to modify ' + name
    };
    return;
  }

  yield [
    packageService.removeModulesByName(name),
    packageService.removeModuleTags(name),
    totalService.plusDeleteModule(),
  ];

  var keys = [];
  for (var i = 0; i < mods.length; i++) {
    var row = mods[i];
    var dist = row.package.dist;
    var key = dist.key;
    if (!key) {
      key = urlparse(dist.tarball).pathname;
    }
    key && keys.push(key);
  }

  if (keys.length > 0) {
    try {
      yield keys.map(function (key) {
        return nfs.remove(key);
      });
    } catch (err) {
      // ignore error here
    }
  }

  // remove the maintainers
  yield* packageService.removeAllMaintainers(name);

  this.body = { ok: true };
};
