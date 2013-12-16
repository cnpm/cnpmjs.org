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

function request(url, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {
      dataType: 'json',
      timeout: 10000
    };
  }
  options = options || {
    dataType: 'json',
    timeout: 10000
  };
  url = config.sourceNpmRegistry + url;  
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
  request('/-/all/since?stale=update_after&startkey=' + startkey, {
    dataType: 'json',
    timeout: 300000
  }, callback);
};

exports.getShort = function (callback) {
  request('/-/short', {
    dataType: 'json',
    timeout: 300000
  }, callback);
};
