/**!
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

var scope = require('../middleware/scope');
var pkg = require('../controllers/web/package');
var user = require('../controllers/web/user');
var sync = require('../controllers/sync');
var total = require('../controllers/total');
var dist = require('../controllers/web/dist');

function routes(app) {
  app.get('/total', total.show);

  // scope package without version
  app.get(/\/package\/(@[\w\-\.]+\/[\w\-\.]+)$/, scope, pkg.display);
  // scope package with version
  app.get(/\/package\/(@[\w\-\.]+\/[\w\-\.]+)\/([\w\d\.]+)$/, scope, pkg.display);
  app.get('/package/:name', pkg.display);
  app.get('/package/:name/:version', pkg.display);

  app.get(/\/browse\/keyword\/(@[\w\-\.]+\/[\w\-\.]+)$/, scope, pkg.search);
  app.get('/browse/keyword/:word', pkg.search);

  app.get('/~:name', user.display);

  app.get(/\/sync\/(@[\w\-\.]+\/[\w\-\.]+)$/, scope, pkg.displaySync);
  app.get('/sync/:name', pkg.displaySync);

  app.put(/\/sync\/(@[\w\-\.]+\/[\w\-\.]+)$/, scope, sync.sync);
  app.put('/sync/:name', sync.sync);

  // params: [$name, $id]
  app.get(/\/sync\/(@[\w\-\.]+\/[\w\-\.]+)\/log\/(\d+)$/, scope, sync.getSyncLog);
  app.get('/sync/:name/log/:id', sync.getSyncLog);

  app.get('/sync', pkg.displaySync);

  app.get('/_list/search/search', pkg.rangeSearch);

  app.get(/^\/dist(\/.*)?/, dist.list);
}

module.exports = routes;
