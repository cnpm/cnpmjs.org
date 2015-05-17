/**!
 * cnpmjs.org - controllers/web/home.js
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

module.exports = function* () {
  yield this.render('home', {
    title: 'cnpmjs.org: Private npm registry and web for Company'
  });
};
