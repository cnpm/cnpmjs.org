/*!
 * cnpmjs.org - common/upyun-nfs.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  Jackson Tian <shyvo1987@gmail.com> (http://jacksontian.github.io)
 */

'use strict';

/**
 * Module dependencies.
 */

var Storage = require('co-upyun-storage');
var fs = require('fs');
var upyun = require('../config').upyun;
var client = Storage.create(upyun.oprator, upyun.password, upyun.bucket);

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
    yield client.deleteFile(options.key);
  } catch (err) {
    // ignore error here
  }

  yield client.putFile(filepath, options.key);
  return { url: exports.url(options.key) };
};

exports.uploadBuffer = function *(buf, options) {
  yield client.putBuffer(buf, options.key);
  return { url: exports.url(options.key) };
};

exports.url = function (key) {
  return client.uri + '/' + client.bucket + key;
};

exports.download = function* (key, filepath, options) {
  var writeStream = fs.createWriteStream(filepath);
  yield client.pipe(key, {
    writeStream: writeStream
  });
};

exports.remove = function *(key) {
  try {
    return yield client.deleteFile(key);
  } catch (err) {
    if (err.code === 404) {
      return;
    }
    throw err;
  }
};
