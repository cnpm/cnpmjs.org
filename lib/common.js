/**!
 * cnpmjs.org - lib/common.js
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
var config = require('../config');
var util = require('util');

exports.getTarballFilepath = function (filename) {
  // ensure download file path unique
  // TODO: not only .tgz, and also other extname
  var name = filename.replace(/\.tgz$/, '.' + crypto.randomBytes(16).toString('hex') + '.tgz');
  return path.join(config.uploadDir, name);
};

exports.getCDNKey = function (name, filename) {
  return '/' + name + '/-/' + filename;
};

exports.setDownloadURL = function (pkg, ctx, host) {
  if (pkg.dist) {
    host = host || ctx.host;
    pkg.dist.tarball = util.format('%s://%s/%s/download/%s-%s.tgz',
      ctx.protocol,
      host, pkg.name, pkg.name, pkg.version);
  }
};

exports.isAdmin = function (username) {
  return typeof config.admins[username] === 'string';
};

exports.isMaintainer = function (user, maintainers) {
  if (user.isAdmin) {
    return true;
  }

  var username = user.name;
  maintainers = maintainers || [];
  var match = maintainers.filter(function (item) {
    return item.name === username;
  });

  return match.length > 0;
};

exports.isLocalModule = function (mods) {
  for (var i = 0; i < mods.length; i++) {
    var r = mods[i];
    if (r.package && r.package._publish_on_cnpm) {
      return true;
    }
  }
  return false;
};
