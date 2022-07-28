'use strict';

var packageService = require('../../../services/package');
var lodash = require('lodash');
var gather = require('co-gather');

// GET /-/_changes?since={timestamp}&limit={number}&cursorId={number}
// List changes since the timestamp
// Similar with https://registry.npmmirror.com/_changes?since=1658974943840
// Change types:
// 1. ✅ PACKAGE_VERSION_ADDED
// 2. ✅ PACKAGE_TAG_ADDED
// 3. 🆕 PACKAGE_UNPUBLISHED
// 4. 🆕 PACKAGE_VERSION_BLOCKED
// 5. ❎ PACKAGE_MAINTAINER_REMOVED
// 6. ❎ PACKAGE_MAINTAINER_CHANGED
// 7. ❎ PACKAGE_TAG_CHANGED
//
// Since we don't have the previous data,
// We can't compute the reliable seqId
// use gmt_modified cinstead of seqId
module.exports = function* listSince() {
  var query = this.query;
  var since = query.since || "0";
  var limit = Number(query.limit);

  // ensure limit
  if (Number.isNaN(limit)) {
    limit = 1000;
  }
  var queryResults = yield gather(
    [
      "listTagSince",
      "listVersionSince",
      "listUnpublishedModuleSince",
      "listBlockVersionSince",
    ].map(function (method) {
      return packageService[method](since, limit);
    })
  );

  var validResults = queryResults.map(function (result) {
    if (!result.isError) {
      return result.value;
    }
    return [];
  });

  var results = lodash.orderBy(
    lodash.flatten(validResults).filter(Boolean),
    "gmt_modified",
    "asc"
  ).slice(0, limit);
  this.body = { results };
};
