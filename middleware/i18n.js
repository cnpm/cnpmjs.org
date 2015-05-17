/**!
 * cnpmjs.org - middleware/i18n.js
 *
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var locales = require('koa-locales');

module.exports = function (options, app) {
  locales(app, options);

  return function* i18n(next) {
    this.state.__ = this.__.bind(this);
    yield* next;
  };
};
