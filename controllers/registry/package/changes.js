'use strict';

const logger = require('../../../common/logger');
var packageService = require('../../../services/package');

// GET /-/_changes?since={timestamp}&limit={number}&cursorId={number}
// List packages names since the timestamp
// Similar with https://replicate.npmjs.com/_changes?since=7139538
module.exports = function* listSince() {
  var query = this.query;
  var result = { _updated: query.since };
  var modules = yield packageService.listModuleSince(query.since, query.limit || 1000, query.cursorId);
  result.modules = modules;

  this.body = result;
};
