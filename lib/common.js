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

exports.isMaintainer = function (ctx, maintainers) {
  if (ctx.session.isAdmin) {
    return true;
  }

  var username = ctx.session.name;
  maintainers = maintainers || [];
  var match = maintainers.filter(function (item) {
    return item.name === username;
  });

  return match.length > 0;
};
