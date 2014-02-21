/*!
 * cnpmjs.org - common/qnfs.js
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
var qn = require('qn');
var config = require('../config');
var client = qn.create(config.qn);

exports._client = client;

/**
 * Upload file
 *
 * @param {String} filepath
 * @param {Object} options
 *  - {String} key
 *  - {Number} size
 * @param {Function(err, result)} callback
 *  - {Object} result
 *   - {String} url
 */
exports.upload = function (filepath, options, callback) {
  client.delete(options.key, function (err, data) {
    client.uploadFile(filepath, {key: options.key, size: options.size}, function (err, data) {
      if (err) {
        return callback(err);
      }
      callback(null, {url: data.url});
    });
  });
};

exports.uploadBuffer = function (buf, options, callback) {
  client.delete(options.key, function (err, data) {
    client.upload(buf, {key: options.key}, function (err, data) {
      if (err) {
        return callback(err);
      }
      callback(null, {url: data.url});
    });
  });
};

exports.url = function (key) {
  return client.resourceURL(key);
};

exports.remove = function (key, callback) {
  client.delete(key, callback);
};

thunkify(exports);
