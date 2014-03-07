/**!
 * cnpmjs.org - proxy/npm.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var thunkify = require('thunkify-wrap');
var urllib = require('urllib');
var config = require('../config');
thunkify(urllib, ['request']);

function *request (url, options) {
  options = options || {};
  options.dataType = options.dataType || 'json';
  options.timeout = options.timeout || 120000;
  url = config.sourceNpmRegistry + url;
  var r;
  try {
    r = yield urllib.request(url, options);
  } catch (err) {
    var statusCode = err.res ? err.res.statusCode : 200;
    var data = err.data || '[empty]';
    if (err.name === 'JSONResponseFormatError' && statusCode >= 500) {
      err.name = 'NPMServerError';
      err.message = 'Status ' + statusCode + ', ' + data.toString();
    }
    throw err;
  }
  return r;
}

exports.get = function *(name) {
  var r = yield request('/' + name);
  var data = r[0];
  var res = r[1];
  if (res && res.statusCode === 404) {
    data = null;
  }
  return data;
};

exports.getAllSince = function *(startkey) {
  var r = yield request('/-/all/since?stale=update_after&startkey=' + startkey, {
    dataType: 'json',
    timeout: 300000
  });
  return r[0];
};

exports.getShort = function *() {
  var r = yield request('/-/short', {
    dataType: 'json',
    timeout: 300000
  });
  return r[0];
};
