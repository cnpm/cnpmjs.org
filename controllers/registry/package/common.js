/**!
 * cnpmjs.org - controllers/registry/package/common.js
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

var packageService = require('../../../services/package');

exports.isMaintainerOrAdmin = function* (moduleName, user) {
  // admin or module's maintainer can modified the module
  if (user.isAdmin) {
    return true;
  }
  return yield* packageService.isMaintainer(moduleName, user.name);
};
