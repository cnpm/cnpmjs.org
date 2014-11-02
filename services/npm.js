/**!
 * cnpmjs.org - services/npm.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var urllib = require('../common/urllib');
var config = require('../config');

var USER_AGENT = 'cnpmjs.org/' + config.version + ' ' + urllib.USER_AGENT;

function* request(url, options) {
  options = options || {};
  options.dataType = options.dataType || 'json';
  options.timeout = options.timeout || 120000;
  options.headers = {
    'user-agent': USER_AGENT
  };
  var registry = options.registry || config.sourceNpmRegistry;
  url = registry + url;
  var r;
  try {
    r = yield urllib.requestThunk(url, options);
  } catch (err) {
    var statusCode = err.status || -1;
    var data = err.data || '[empty]';
    if (err.name === 'JSONResponseFormatError' && statusCode >= 500) {
      err.name = 'NPMServerError';
      err.message = 'Status ' + statusCode + ', ' + data.toString();
    }
    throw err;
  }
  return r;
}

exports.request = request;

exports.getUser = function* (name) {
  var url = '/-/user/org.couchdb.user:' + name;
  var r = yield* request(url);
  var data = r.data;
  if (data && !data.name) {
    data = null;
  }
  return data;
};

exports.get = function* (name) {
  var r = yield* request('/' + name);
  var data = r.data;
  if (r.status === 404) {
    data = null;
  }
  return data;
};

exports.getAllSince = function* (startkey, timeout) {
  var r = yield* request('/-/all/since?stale=update_after&startkey=' + startkey, {
    timeout: timeout || 300000
  });
  return r.data;
};

exports.getShort = function* (timeout) {
  var r = yield* request('/-/short', {
    timeout: timeout || 300000,
    // registry.npmjs.org/-/short is 404 now therefore have a fallback
    registry: config.sourceNpmRegistryIsCNpm ? config.sourceNpmRegistry : 'http://r.cnpmjs.org',
  });
  return r.data;
};

exports.getPopular = function* (top, timeout) {
  var r = yield* request('/-/_view/dependedUpon?group_level=1', {
    registry: config.officialNpmRegistry,
    timeout: timeout || 60000
  });
  if (!r.data || !r.data.rows || !r.data.rows.length) {
    return [];
  }

  return r.data.rows.sort(function (a, b) {
    return b.value - a.value;
  })
  .slice(0, top)
  .map(function (r) {
    return r.key && r.key[0];
  })
  .filter(function (r) {
    return r;
  });
};
