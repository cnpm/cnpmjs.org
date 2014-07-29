/**!
 * cnpmjs.org - services/package.js
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

var Module = require('../proxy/module');
var ModuleMaintainer = require('../proxy/module_maintainer');
var User = require('../proxy/user');

exports.listMaintainers = function* (name) {
  var names = yield* ModuleMaintainer.get(name);
  if (names.length === 0) {
    return names;
  }
  var users = yield* User.listByNames(names);
  return users.map(function (user) {
    return {
      name: user.name,
      email: user.email
    };
  });
};

exports.listMaintainerNamesOnly = function* (name) {
  return yield* ModuleMaintainer.get(name);
};

exports.updateMaintainers = function* (name, usernames) {
  var rs = yield [
    ModuleMaintainer.update(name, usernames),
    Module.updateLastModified(name),
  ];
  return rs[0];
};

exports.isMaintainer = function* (name, username) {
  var rs = yield [
    ModuleMaintainer.get(name),
    Module.getLatest(name)
  ];
  var maintainers = rs[0];
  var latestMod = rs[1];

  if (latestMod && !latestMod.package._publish_on_cnpm) {
    // no one can update public package maintainers
    // public package only sync from source npm registry
    return false;
  }

  if (maintainers.length === 0) {
    // if not found maintainers, try to get from latest module package info
    var ms = latestMod && latestMod.package && latestMod.package.maintainers;
    if (ms && ms.length > 0) {
      maintainers = ms.map(function (user) {
        return user.name;
      });
    }
  }
  if (maintainers.length === 0) {
    // no maintainers, meaning this module is free for everyone
    return true;
  }
  return maintainers.indexOf(username) >= 0;
};
