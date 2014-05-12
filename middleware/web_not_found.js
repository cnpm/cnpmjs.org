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

var debug = require('debug')('cnpmjs.org:middleware:web_not_found');

module.exports = function *notFound(next) {
  yield *next;

  if (this.status && this.status !== 404) {
    return;
  }

  var m = /^\/([\w\-\_\.]+)\/?$/.exec(this.url);
  debug('%s match %j', this.url, m);
  if (m) {
    return this.redirect('/package/' + m[1]);
  }

  this.status = 404;
  this.type = 'text/html';
  this.charset = 'utf-8';
  this.body = 'Cannot GET ' + this.path;
};
