/**!
 * cnpmjs.org - middleware/web_not_found.js
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
  this.type = 'text/html';
  this.charset = 'utf-8';
  this.body = 'Cannot GET ' + this.path;
};
