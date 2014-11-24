/**!
 * cnpmjs.org - controllers/registry/package/search.js
 *
 * Copyright(c) CatTail and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   CatTail <zhongchiyu@gmail.com> (http://cattail.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var packageService = require('../../../services/package');

// GET /-/all
// List all packages names
// https://github.com/npm/npm-registry-client/blob/master/lib/get.js#L86
exports.search = function* () {
  var keyword = this.params.keyword;
  var packages = packageService.searchByKeyword(keyword);
  this.body = {
      packages: packages
  };
};
