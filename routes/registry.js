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
var editable = require('../middleware/editable');

var showTotal = require('../controllers/total');

var listAll = require('../controllers/registry/package/list_all');
var listShorts = require('../controllers/registry/package/list_shorts');
var listSince = require('../controllers/registry/package/list_since');
var listAllVersions = require('../controllers/registry/package/list');
var getOneVersion = require('../controllers/registry/package/show');
var savePackage = require('../controllers/registry/package/save');
var tag = require('../controllers/registry/package/tag');
var removePackage = require('../controllers/registry/package/remove');
var removeOneVersion = require('../controllers/registry/package/remove_version');
var updatePackage = require('../controllers/registry/package/update');
var downloadPackage = require('../controllers/registry/package/download');
var searchPackage = require('../controllers/registry/package/search');

var addUser = require('../controllers/registry/user/add');
var showUser = require('../controllers/registry/user/show');
var updateUser = require('../controllers/registry/user/update');

var sync = require('../controllers/sync');
var userPackage = require('../controllers/registry/user_package');

function routes(app) {

  function* jsonp(next) {
    yield* next;
    if (this.body) {
      this.jsonp = this.body;
    }
  }

  app.get('/', jsonp, showTotal);

  // before /:name/:version
  // get all modules, for npm search
  app.get('/-/all', listAll);
  app.get('/-/all/since', listSince);
  // get all module names, for auto completion
  app.get('/-/short', listShorts);

  // module
  // scope package: params: [$name]
  app.get(/^\/(@[\w\-\.]+\/[\w\-\.]+)$/, syncByInstall, listAllVersions);
  // scope package: params: [$name, $version]
  app.get(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/([\w\.\-]+)$/, syncByInstall, getOneVersion);

  app.get('/:name', syncByInstall, listAllVersions);
  app.get('/:name/:version', syncByInstall, getOneVersion);

  // try to add module
  app.put(/^\/(@[\w\-\.]+\/[\w\-\.]+)$/, login, publishable, savePackage);
  app.put('/:name', login, publishable, savePackage);

  // sync from source npm
  app.put('/:name/sync', sync.sync);
  app.get('/:name/sync/log/:id', sync.getSyncLog);

  // add tag
  app.put(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/([\w\-\.]+)$/, login, editable, tag);
  app.put('/:name/:tag', login, editable, tag);

  // need limit by ip
  app.get(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/download\/(@[\w\-\.]+\/[\w\-\.]+)$/, limit, downloadPackage);
  app.get('/:name/download/:filename', limit, downloadPackage);
  app.get(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/\-\/(@[\w\-\.]+\/[\w\-\.]+)$/, limit, downloadPackage);
  app.get('/:name/-/:filename', limit, downloadPackage);

  // delete tarball and remove one version
  app.delete(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/download\/(@[\w\-\.]+\/[\w\-\.]+)\/\-rev\/([\w\-\.]+)$/,
    login, publishable, editable, removeOneVersion);
  app.delete('/:name/download/:filename/-rev/:rev', login, publishable, editable, removeOneVersion);

  // update module, unpublish will PUT this
  app.put(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/\-rev\/([\w\-\.]+)$/, login, publishable, editable, updatePackage);
  app.put('/:name/-rev/:rev', login, publishable, editable, updatePackage);

  // remove all versions
  app.delete(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/\-rev\/([\w\-\.]+)$/, login, publishable, editable, removePackage);
  app.delete('/:name/-rev/:rev', login, publishable, editable, removePackage);

  // try to create a new user
  // https://registry.npmjs.org/-/user/org.couchdb.user:fengmk2
  app.put('/-/user/org.couchdb.user::name', addUser);
  app.get('/-/user/org.couchdb.user::name', showUser);
  app.put('/-/user/org.couchdb.user::name/-rev/:rev', login, updateUser);

  // list all packages of user
  app.get('/-/by-user/:user', userPackage.list);

  // list all package of keyword
  app.get('/-/by-keyword/:keyword', searchPackage.search);
}

module.exports = routes;
