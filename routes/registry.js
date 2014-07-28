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

var limit = require('../middleware/limit');
var login = require('../middleware/login');
var publishable = require('../middleware/publishable');
var syncByInstall = require('../middleware/sync_by_install');
var total = require('../controllers/total');
var mod = require('../controllers/registry/module');
var user = require('../controllers/registry/user');
var sync = require('../controllers/sync');

function routes(app) {

  function* jsonp(next) {
    yield* next;
    if (this.body) {
      this.jsonp = this.body;
    }
  }

  app.get('/', jsonp, total.show);

  //before /:name/:version
  //get all modules, for npm search
  app.get('/-/all', mod.listAllModules);
  app.get('/-/all/since', mod.listAllModulesSince);
  //get all module names, for auto completion
  app.get('/-/short', mod.listAllModuleNames);

  // module
  // scope package: params: [$name]
  app.get(/^\/(@[\w\-\.]+\/[\w\-\.]+)$/, syncByInstall, mod.show);
  // scope package: params: [$name, $version]
  app.get(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/([\w\.\-]+)$/, syncByInstall, mod.get);

  app.get('/:name', syncByInstall, mod.show);
  app.get('/:name/:version', syncByInstall, mod.get);
  // try to add module
  app.put(/^\/(@[\w\-\.]+\/[\w\-\.]+)$/, login, publishable, mod.addPackageAndDist);
  app.put('/:name', login, publishable, mod.addPackageAndDist);

  // sync from source npm
  app.put('/:name/sync', sync.sync);
  app.get('/:name/sync/log/:id', sync.getSyncLog);

  app.put(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/([\w\-\.]+)$/, login, mod.updateTag);
  app.put('/:name/:tag', login, mod.updateTag);

  // need limit by ip
  app.get(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/download\/(@[\w\-\.]+\/[\w\-\.]+)$/, limit, mod.download);
  app.get('/:name/download/:filename', limit, mod.download);

  // delete tarball
  app.delete(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/download\/(@[\w\-\.]+\/[\w\-\.]+)\/\-rev\/([\w\-\.]+)$/,
    login, publishable, mod.removeTar);
  app.delete('/:name/download/:filename/-rev/:rev', login, publishable, mod.removeTar);

  // update module, unpublish will PUT this
  app.put(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/\-rev\/([\w\-\.]+)$/, login, publishable, mod.updateOrRemove);
  app.delete(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/\-rev\/([\w\-\.]+)$/, login, publishable, mod.removeAll);
  app.put('/:name/-rev/:rev', login, publishable, mod.updateOrRemove);
  app.delete('/:name/-rev/:rev', login, publishable, mod.removeAll);

  // try to create a new user
  // https://registry.npmjs.org/-/user/org.couchdb.user:fengmk2
  app.put('/-/user/org.couchdb.user::name', user.add);
  app.get('/-/user/org.couchdb.user::name', user.show);
  app.put('/-/user/org.couchdb.user::name/-rev/:rev', login, user.update);
  // _session
  app.post('/_session', user.authSession);
}

module.exports = routes;
