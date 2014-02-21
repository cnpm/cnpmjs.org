/*!
 * cnpmjs.org - middleware/login.js
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

module.exports = function *login(next) {
  if (!this.session.name) {
    this.status = 401;
    this.body = {
      error: 'unauthorized',
      reason: 'Login first.'
    };
    return;
  }
  yield next;
};
