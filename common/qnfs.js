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

var qn = require('qn');
var config = require('../config');

var client = qn.create(config.qn);

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
    client.uploadFile(filepath, {key: options.key, size: options.size}, callback);
  });
};
