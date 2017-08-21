'use strict';

var packageService = require('../services/package');

module.exports = function* (next) {
  var name = this.params.name || this.params[0];
  var pkg = yield packageService.getLatestModule(name);
  if (pkg) {
    return yield next;
  }
  this.status = 404;
  this.body = {
    error: 'not_found',
    reason: 'document not found'
  };
};
