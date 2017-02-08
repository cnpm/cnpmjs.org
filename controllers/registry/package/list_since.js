'use strict';

const packageService = require('../../../services/package');

const A_WEEK_MS = 3600000 * 24 * 7;

// GET /-/all/since?stale=update_after&startkey={key}
// List packages names since startkey
// https://github.com/npm/npm-registry-client/blob/master/lib/get.js#L89
module.exports = function* listSince() {
  const query = this.query;
  if (query.stale !== 'update_after') {
    this.status = 400;
    this.body = {
      error: 'query_parse_error',
      reason: 'Invalid value for `stale`.',
    };
    return;
  }

  let startkey = Number(query.startkey);
  if (!startkey) {
    this.status = 400;
    this.body = {
      error: 'query_parse_error',
      reason: 'Invalid value for `startkey`.',
    };
    return;
  }

  const updated = Date.now();
  if (updated - startkey > A_WEEK_MS) {
    startkey = updated - A_WEEK_MS;
    console.warn('[%s] list modules since time out of range: query: %j, ip: %s',
      Date(), query, this.ip);
  }

  const names = yield packageService.listPublicModuleNamesSince(startkey);
  const result = { _updated: updated };
  names.forEach(function(name) {
    result[name] = true;
  });

  this.body = result;
};
