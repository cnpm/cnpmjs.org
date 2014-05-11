/**!
 * cnpmjs.org - controllers/utils.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:controllers:utils');
var path = require('path');
var fs = require('fs');
var utility = require('utility');
var ms = require('ms');
var nfs = require('../common/nfs');
var config = require('../config');

var DOWNLOAD_TIMEOUT = ms('10m');

exports.downloadAsReadStream = function* (key) {
  var tmpPath = path.join(config.uploadDir,
    utility.randomString() + key.replace(/\//g, '-'));
  function cleanup() {
    debug('cleanup %s', tmpPath);
    fs.unlink(tmpPath, utility.noop);
  }
  debug('downloadAsReadStream() %s to %s', key, tmpPath);
  try {
    yield nfs.download(key, tmpPath, {timeout: DOWNLOAD_TIMEOUT});
  } catch (err) {
    debug('downloadAsReadStream() %s to %s error: %s', key, tmpPath, err.stack);
    cleanup();
    throw err;
  }
  var tarball = fs.createReadStream(tmpPath);
  tarball.once('error', cleanup);
  tarball.once('end', cleanup);
  return tarball;
};
