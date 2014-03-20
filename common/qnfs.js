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

thunkify(client, ['delete', 'uploadFile', 'upload']);

exports._client = client;

/**
 * Upload file
 *
 * @param {String} filepath
 * @param {Object} options
 *  - {String} key
 *  - {Number} size
 */
exports.upload = function *(filepath, options) {
  try {
    yield client.delete(options.key);
  } catch (err) {
    // ignore error here
  }

  var res = yield client.uploadFile(filepath, {
    key: options.key,
    size: options.size
  });
  var url = res && res[0] ? res[0].url : '';
  return { url: url };
};

exports.uploadBuffer = function *(buf, options) {
  try {
    yield client.delete(options.key);
  } catch (err) {
    // ignore error here
  }

  var res = yield client.upload(buf, {key: options.key});
  var url = res && res[0] ? res[0].url : '';
  return { url: url };
};

exports.url = function (key) {
  return client.resourceURL(key);
};

exports.remove = function *(key) {
  try {
    return yield client.delete(key);
  } catch (err) {
    if (err.name === 'QiniuFileNotExistsError') {
      return;
    }
    throw err;
  }
};
