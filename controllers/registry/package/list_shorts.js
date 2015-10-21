/**!
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var packageService = require('../../../services/package');

// GET /-/short
// List all packages names only
module.exports = function* () {
  this.body = yield packageService.listAllPublicModuleNames();
};
