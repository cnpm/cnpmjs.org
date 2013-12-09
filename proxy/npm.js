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

function request(url, callback) {
  url = config.sourceNpmRegistry + url;
  var options = {
    dataType: 'json',
    timeout: 10000,
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
