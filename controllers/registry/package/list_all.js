'use strict';

const packageService = require('../../../services/package');

// GET /-/all
// List all packages names
// https://github.com/npm/npm-registry-client/blob/master/lib/get.js#L86
module.exports = function* () {
  const updated = Date.now();
  const names = yield packageService.listAllPublicModuleNames();
  const result = { _updated: updated };
  names.forEach(function(name) {
    result[name] = true;
  });
  this.body = result;
};
