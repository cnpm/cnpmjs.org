/**!
 * cnpmjs.org - routes/web.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var showPackage = require('../controllers/web/package/show');
var searchPackage = require('../controllers/web/package/search');
var searchRange = require('../controllers/web/package/search_range');
var listPrivates = require('../controllers/web/package/list_privates');
var showSync = require('../controllers/web/show_sync');
var showUser = require('../controllers/web/user/show');
var sync = require('../controllers/sync');
var showTotal = require('../controllers/total');
var badge = require('../controllers/web/badge');
var admin = require('../controllers/web/admin');

var auth = require('../middleware/auth')();
var require_admin = require('../middleware/access_level').require_admin;

function routes(app) {
  app.get('/total', showTotal);

  // scope package without version
  app.get(/\/package\/(@[\w\-\.]+\/[\w\-\.]+)$/, showPackage);
  // scope package with version
  app.get(/\/package\/(@[\w\-\.]+\/[\w\-\.]+)\/([\w\d\.]+)$/, showPackage);
  app.get('/package/:name', showPackage);
  app.get('/package/:name/:version', showPackage);

  app.get('/privates', listPrivates);

  app.get(/\/browse\/keyword\/(@[\w\-\.]+\/[\w\-\.]+)$/, searchPackage);
  app.get('/browse/keyword/:word', searchPackage);

  app.get('/~:name', showUser);

  app.get(/\/sync\/(@[\w\-\.]+\/[\w\-\.]+)$/, showSync);
  app.get('/sync/:name', showSync);
  app.get('/sync', showSync);
  app.put(/\/sync\/(@[\w\-\.]+\/[\w\-\.]+)$/, sync.sync);
  app.put('/sync/:name', sync.sync);

  app.get(/\/sync\/(@[\w\-\.]+\/[\w\-\.]+)\/log\/(\d+)$/, sync.getSyncLog);
  app.get('/sync/:name/log/:id', sync.getSyncLog);

  app.get('/_list/search/search', searchRange);

  app.get(/^\/badge\/v\/([@\w\-\.\/]+)\.svg$/, badge.version);
  app.get(/^\/badge\/d\/([@\w\-\.\/]+)\.svg$/, badge.downloads);

  app.get('/admin', auth, require_admin, admin.admin);
  app.get('/admin/user', auth, require_admin, admin.user.userList);
  app.put('/admin/user/:uid', auth, require_admin, admin.user.updateUser);
}

module.exports = routes;
