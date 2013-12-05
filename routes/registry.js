/**!
 * cnpmjs.org - routes/registry.js
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

var login = require('../middleware/login');
var home = require('../controllers/registry/home');
var mod = require('../controllers/registry/module');
var pkg = require('../controllers/registry/package');
var tag = require('../controllers/registry/tag');
var user = require('../controllers/registry/user');

function routes(app) {
  app.get('/', home.show);

  // module
  app.get('/:name', mod.show);
  // try to add module
  app.put('/:name', login, mod.add);

  // put tarball
  // https://registry.npmjs.org/cnpmjs.org/-/cnpmjs.org-0.0.0.tgz/-rev/1-c85bc65e8d2470cc4d82b8f40da65b8e
  app.put('/:name/-/:filename/-rev/:rev', login, mod.upload);
  // put package.json to module
  app.put('/:name/:version/-tag/latest', login, mod.updateLatest);

  // try to create a new user
  // https://registry.npmjs.org/-/user/org.couchdb.user:fengmk2
  app.put('/-/user/org.couchdb.user::name', user.add);
  app.get('/-/user/org.couchdb.user::name', user.show);
  app.put('/-/user/org.couchdb.user::name/-rev/:rev', login, user.update);

  // _session
  app.post('/_session', user.authSession);
}

module.exports = routes;
