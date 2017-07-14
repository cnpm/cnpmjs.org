'use strict';

var packageService = require('../../../services/package');

// GET /-/all
// List all packages names
// https://github.com/npm/npm-registry-client/blob/master/lib/get.js#L86
module.exports = function* () {
  var updated = Date.now();
  var names = yield packageService.listAllPublicModuleNames();
  var result = { _updated: updated };
  names.forEach(function (name) {
    result[name] = true;
  });
  this.body = result;
};
