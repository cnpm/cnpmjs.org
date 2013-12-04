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

var mod = require('../controllers/registry/module');
var pkg = require('../controllers/registry/package');
var tag = require('../controllers/registry/tag');
var user = require('../controllers/registry/user');

function routes(app) {
  app.get('/:name', mod.show);
  app.put('/:name', mod.add);

  // put tarball
  // https://registry.npmjs.org/cnpmjs.org/-/cnpmjs.org-0.0.0.tgz/-rev/1-c85bc65e8d2470cc4d82b8f40da65b8e
  app.put('/:name/-/:filename/-rev/:rev', pkg.upload);
  // tag
  app.put('/:name/:version/-tag/latest', tag.updateLatest);

  //try to create a new user
  // https://registry.npmjs.org/-/user/org.couchdb.user:fengmk2
  app.put('/-/user/:name', user.add);
  app.get('/-/user/:name', user.show);
  app.put('/-/user/:name/-rev/:rev', user.upload);

  // _session
  app.post('/_session', user.authSession);
}

module.exports = routes;
