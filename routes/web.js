/*!
 * cnpmjs.org - routes/web.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var home = require('../controllers/web/home');

function routes(app) {
  app.get('/', home);
}

module.exports = routes;
