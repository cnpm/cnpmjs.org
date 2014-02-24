/**!
 * cnpmjs.org - middleware/publishable.js
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

module.exports = function *notFound(next) {
  yield next;

  if (this.status) {
    return;
  }
  this.status = 404;
  this.body = {
    error: 'not_found',
    reason: 'document not found'
  };
};
