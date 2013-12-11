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

var pkg = require('../controllers/web/package');
var user = require('../controllers/web/user');
var sync = require('../controllers/sync');

function routes(app) {
  app.get('/package/:name', pkg.display);
  app.get('/package/:name/:version', pkg.display);
  app.get('/browse/keyword/:word', pkg.search);

  app.get('/~:name', user.display);

  app.get('/sync/:name', pkg.displaySync);
  app.put('/sync/:name', sync.sync);
  app.get('/sync/:name/log/:id', sync.getSyncLog);
}

module.exports = routes;
