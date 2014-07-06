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

exports.updateMaintainers = function* (name, usernames) {
  var rs = yield [
    ModuleMaintainer.update(name, usernames),
    Module.updateLastModified(name),
  ];
  return rs[0];
};

exports.isMaintainer = function* (name, username) {
  var maintainers = yield* ModuleMaintainer.get(name);
  if (maintainers.length === 0) {
    // no maintainers, meaning this module is free for everyone
    return true;
  }
  return maintainers.indexOf(username) >= 0;
};
