/**!
 * cnpmjs.org - middleware/publishable.js
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

var config = require('../config');

module.exports = function *publishable(next) {
  if (config.enablePrivate && !this.user.isAdmin) {
    // private mode, only admin user can publish
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Private mode enable, only admin can publish this module'
    };
    return;
  }
  yield *next;
};
