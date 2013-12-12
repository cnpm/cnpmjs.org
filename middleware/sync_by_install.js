/*!
 * cnpmjs.org - middleware/sync_by_install.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var config = require('../config');

/**
 * req.session.allowSync  -  allow sync triggle by cnpm install
 */

module.exports = function (req, res, next) {
  if (!config.syncByInstall || !config.enablePrivate) {
    // only config.enablePrivate should enable sync on install
    return next();
  }
  // request not by node, consider it request from web
  if (req.headers['user-agent'] && req.headers['user-agent'].indexOf('node') !== 0) {
    return next();
  }

  req.session.allowSync = true;
  if (req.session.isAdmin) {
    // if current user is admin, should not enable auto sync on install, because it would be unpublish
    req.session.allowSync = false;
  }

  next();
};
