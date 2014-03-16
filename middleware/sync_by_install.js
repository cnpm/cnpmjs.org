/**!
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
 * this.allowSync  -  allow sync triggle by cnpm install
 */

module.exports = function *syncByInstall(next) {
  if (!config.syncByInstall || !config.enablePrivate) {
    // only config.enablePrivate should enable sync on install
    return yield *next;
  }
  // request not by node, consider it request from web
  var ua = this.get('user-agent');
  if (!ua || ua.indexOf('node') < 0) {
    return yield *next;
  }

  if (this.query.write) {
    return yield *next;
  }

  this.allowSync = true;
  yield *next;
};
