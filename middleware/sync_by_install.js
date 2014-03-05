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

var debug = require('debug')('cnpmjs.org:middleware:sync_by_install');
var config = require('../config');

/**
 * req.session.allowSync  -  allow sync triggle by cnpm install
 */

module.exports = function *(next) {
  if (!config.syncByInstall || !config.enablePrivate) {
    // only config.enablePrivate should enable sync on install
    return yield* next;
  }
  // request not by node, consider it request from web
  if (this.get('user-agent') && this.get('user-agent').indexOf('node') !== 0) {
    return yield* next;
  }

  this.session.allowSync = true;
  if (this.session.isAdmin) {
    // if current user is admin, should not enable auto sync on install, because it would be unpublish
    this.session.allowSync = false;
  }

  // TODO: allow sync will let publish sync package...
  this.session.allowSync = false;

  debug('%s allowSync: %s', this.session.name, this.session.allowSync);
  yield* next;
};
