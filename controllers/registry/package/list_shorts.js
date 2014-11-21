/**!
 * cnpmjs.org - controllers/registry/package/list_shorts.js
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

// GET /-/short
// List all packages names only
module.exports = function* () {
  this.body = yield* packageService.listAllPublicModuleNames();
};
