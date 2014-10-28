/**!
 * cnpmjs.org - controllers/registry/package/list_all.js
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

module.exports = function* () {
  var updated = Date.now();
  var names = yield* packageService.listAllPublicModuleNames();
  var result = { _updated: updated };
  names.forEach(function (name) {
    result[name] = true;
  });
  this.body = result;
};
