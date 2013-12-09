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
var publishable = require('../middleware/publishable');
var syncByInstall = require('../middleware/sync_by_install');
var home = require('../controllers/registry/home');
var mod = require('../controllers/registry/module');
var pkg = require('../controllers/registry/package');
var tag = require('../controllers/registry/tag');
var user = require('../controllers/registry/user');

function routes(app) {
  app.get('/', home.show);

  //before /:name/:version
  //get all modules, for npm search
  app.get('/-/all', mod.listAllModules);
  app.get('/-/all/since', mod.listAllModulesSince);
  //get all module names, for auto completion
  app.get('/-/short', mod.listAllModuleNames);

  // module
  app.get('/:name', [syncByInstall], mod.show);
  app.get('/:name/:version', [syncByInstall], mod.get);
  // try to add module
  app.put('/:name', [login, publishable], mod.add);

  // sync from source npm
  app.put('/:name/sync', [login], mod.sync);
  app.get('/:name/sync/log/:id', mod.getSyncLog);

  app.get('/:name/download/:filename', mod.download);

  // put tarball
  // https://registry.npmjs.org/cnpmjs.org/-/cnpmjs.org-0.0.0.tgz/-rev/1-c85bc65e8d2470cc4d82b8f40da65b8e
  app.put('/:name/-/:filename/-rev/:rev', [login, publishable], mod.upload);
  // delete tarball
  app.delete('/:name/-/:filename/-rev/:rev', [login, publishable], mod.removeTar);

  // put package.json to module
  app.put('/:name/:version/-tag/latest', [login, publishable], mod.updateLatest);

  // update module, unpublish will PUT this
  app.put('/:name/-rev/:rev', [login, publishable], mod.removeWithVersions);
  app.delete('/:name/-rev/:rev', [login, publishable], mod.removeAll);

  // try to create a new user
  // https://registry.npmjs.org/-/user/org.couchdb.user:fengmk2
  app.put('/-/user/org.couchdb.user::name', user.add);
  app.get('/-/user/org.couchdb.user::name', user.show);
  app.put('/-/user/org.couchdb.user::name/-rev/:rev', login, user.update);

  // _session
  app.post('/_session', user.authSession);
}

module.exports = routes;
