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
  if (this.body) {
    return;
  }

  var m = /^\/([\w\-\_\.]+)\/?$/.exec(this.url);
  debug('%s match %j', this.url, m);
  if (m) {
    return this.redirect('/package/' + m[1]);
  }

  // package not found
  m = /\/package\/([\w\-\_\.]+)\/?$/.exec(this.url);
  if (m) {
    var name = m[1];
    this.status = 404;
    yield* this.render('404', {
      title: 'Package - ' + name,
      name: name
    });
    return;
  }

  this.status = 404;
  this.body = 'Cannot GET ' + this.path;
};
