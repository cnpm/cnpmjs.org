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

exports.addMaintainers = function* (name, usernames) {
  return yield* ModuleMaintainer.addMulti(name, usernames);
};

exports.updateMaintainers = function* (name, usernames) {
  var rs = yield [
    ModuleMaintainer.update(name, usernames),
    Module.updateLastModified(name),
  ];
  return rs[0];
};

exports.removeAllMaintainers = function* (name) {
  return yield* ModuleMaintainer.removeAll(name);
};

exports.authMaintainer = function* (packageName, username) {
  var rs = yield [
    ModuleMaintainer.get(packageName),
    Module.getLatest(packageName)
  ];
  var maintainers = rs[0];
  var latestMod = rs[1];
  if (maintainers.length === 0) {
    // if not found maintainers, try to get from latest module package info
    var ms = latestMod && latestMod.package && latestMod.package.maintainers;
    if (ms && ms.length > 0) {
      maintainers = ms.map(function (user) {
        return user.name;
      });
    }
  }

  var isMaintainer = false;

  if (latestMod && !latestMod.package._publish_on_cnpm) {
    // no one can update public package maintainers
    // public package only sync from source npm registry
    isMaintainer = false;
  } else if (maintainers.length === 0) {
    // no maintainers, meaning this module is free for everyone
    isMaintainer = true;
  } else if (maintainers.indexOf(username) >= 0) {
    isMaintainer = true;
  }

  return {
    isMaintainer: isMaintainer,
    maintainers: maintainers
  };
};

exports.isMaintainer = function* (name, username) {
  var result = yield* exports.authMaintainer(name, username);
  return result.isMaintainer;
};
