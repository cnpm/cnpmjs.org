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

module.exports = function* syncByInstall(next) {
  this.allowSync = false;
  if (!config.syncByInstall) {
    // only config.enablePrivate should enable sync on install
    return yield* next;
  }
  // request not by node, consider it request from web, dont sync
  var ua = this.get('user-agent');
  if (!ua || ua.indexOf('node') < 0) {
    return yield* next;
  }

  // if request with `/xxx?write=true`, meaning the read request using for write, dont sync
  if (this.query.write) {
    return yield* next;
  }

  var name = this.params.name || this.params[0];

  // scoped package dont sync
  if (name && name[0] === '@') {
    return yield* next;
  }

  this.allowSync = true;
  yield* next;
};
