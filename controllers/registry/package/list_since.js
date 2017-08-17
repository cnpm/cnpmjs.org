'use strict';

var packageService = require('../../../services/package');

var A_WEEK_MS = 3600000 * 24 * 7;
var TWA_DAYS_MS = 3600000 * 24 * 2;

// GET /-/all/since?stale=update_after&startkey={key}
// List packages names since startkey
// https://github.com/npm/npm-registry-client/blob/master/lib/get.js#L89
module.exports = function* listSince() {
  var query = this.query;
  if (query.stale !== 'update_after') {
    this.status = 400;
    this.body = {
      error: 'query_parse_error',
      reason: 'Invalid value for `stale`.'
    };
    return;
  }

  var startkey = Number(query.startkey);
  if (!startkey) {
    this.status = 400;
    this.body = {
      error: 'query_parse_error',
      reason: 'Invalid value for `startkey`.'
    };
    return;
  }

  var updated = Date.now();
  if (updated - startkey > A_WEEK_MS) {
    startkey = updated - TWA_DAYS_MS;
    console.warn('[%s] list modules since time out of range: query: %j, ip: %s, limit to %s',
      Date(), query, this.ip, startkey);
  }

  var names = yield packageService.listPublicModuleNamesSince(startkey);
  var result = { _updated: updated };
  names.forEach(function (name) {
    result[name] = true;
  });

  this.body = result;
};
