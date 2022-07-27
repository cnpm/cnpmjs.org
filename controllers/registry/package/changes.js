'use strict';

var packageService = require('../../../services/package');

// GET /-/_changes?since={timestamp}&limit={number}&cursorId={number}
// List packages names since the timestamp
// Similar with https://replicate.npmjs.com/_changes?since=7139538
module.exports = function* listSince() {
  var query = this.query;
  var since = query.since || '0';
  var limit = Number(query.limit);
  if (Number.isNaN(limit)) {
    limit = 1000;
  }
  var result = { _updated: since};
  var modules = yield packageService.listTagSince(since, limit, query.cursorId);
  result.modules = modules;

  this.body = result;
};
