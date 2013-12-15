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

var urllib = require('urllib');
var config = require('../config');

function request(url, callback, options) {
  url = config.sourceNpmRegistry + url;
  options = options || {
    dataType: 'json',
    timeout: 10000
  };
  urllib.request(url, options, callback);
}

exports.get = function (name, callback) {
  request('/' + name, function (err, data, res) {
    if (err) {
      return callback(err);
    }
    res = res || {};
    if (res.statusCode === 404) {
      data = null;
    }
    callback(null, data, res);
  });
};

exports.getAllSince = function (startkey, callback) {
  request('/-/all/since?stale=update_after&startkey=' + startkey, callback, {
    dataType: 'json',
    timeout: 300000
  });
};

exports.getShort = function (callback) {
  request('/-/short', callback, {
    dataType: 'json',
    timeout: 300000
  });
};
