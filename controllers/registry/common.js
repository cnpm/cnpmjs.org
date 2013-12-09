/**!
 * cnpmjs.org - controllers/registry/common.js
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

var crypto = require('crypto');
var path = require('path');
var config = require('../../config');

exports.getTarballFilepath = function (filename) {
  // ensure download file path unique
  var name = filename.replace(/\.tgz$/, '.' + crypto.randomBytes(16).toString('hex') + '.tgz');
  return path.join(config.uploadDir, name);
};

exports.getCDNKey = function (name, filename) {
  return '/' + name + '/-/' + filename;
};

exports.downloadURL = function (pkg, req) {
  if (pkg.dist && pkg.dist.tarball) {
    pkg.dist.tarball = 'http://' + req.headers.host + '/' + pkg.name + '/download/' + path.basename(pkg.dist.tarball);
  }
};
