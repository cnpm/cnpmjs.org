'use strict';

var limit = require('../middleware/limit');
var login = require('../middleware/login');
var publishable = require('../middleware/publishable');
var syncByInstall = require('../middleware/sync_by_install');
var editable = require('../middleware/editable');
var existsPackage = require('../middleware/exists_package');
var unpublishable = require('../middleware/unpublishable');

var showTotal = require('../controllers/total');

var listAll = require('../controllers/registry/package/list_all');
var listShorts = require('../controllers/registry/package/list_shorts');
var listSince = require('../controllers/registry/package/list_since');
var listAllVersions = require('../controllers/registry/package/list');
var listDependents = require('../controllers/registry/package/list_dependents');
var getOneVersion = require('../controllers/registry/package/show');
var savePackage = require('../controllers/registry/package/save');
var tag = require('../controllers/registry/package/tag');
var removePackage = require('../controllers/registry/package/remove');
var removeOneVersion = require('../controllers/registry/package/remove_version');
var updatePackage = require('../controllers/registry/package/update');
var downloadPackage = require('../controllers/registry/package/download');
var downloadTotal = require('../controllers/registry/package/download_total');
var listPackagesByUser = require('../controllers/registry/package/list_by_user');

var addUser = require('../controllers/registry/user/add');
var showUser = require('../controllers/registry/user/show');
var updateUser = require('../controllers/registry/user/update');

var sync = require('../controllers/sync');
var userPackage = require('../controllers/registry/user_package');
var tags = require('../controllers/registry/package/dist_tag');

function routes(app) {

  function* jsonp(next) {
    yield next;
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
  app.get(/^\/(@[\w\-\.]+\/[^\/]+)$/, syncByInstall, listAllVersions);
  // scope package: params: [$name, $version]
  app.get(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/([^\/]+)$/, syncByInstall, getOneVersion);

  app.get('/:name', syncByInstall, listAllVersions);
  app.get('/:name/:version', syncByInstall, getOneVersion);

  // try to add module
  app.put(/^\/(@[\w\-\.]+\/[\w\-\.]+)$/, login, publishable, savePackage);
  app.put('/:name', login, publishable, savePackage);

  // sync from source npm
  app.put(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/sync$/, sync.sync);
  app.put('/:name/sync', sync.sync);
  app.get(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/sync\/log\/(\d+)$/, sync.getSyncLog);
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
    login, unpublishable, removeOneVersion);
  app.delete('/:name/download/:filename/-rev/:rev', login, unpublishable, removeOneVersion);

  // update module, unpublish will PUT this
  app.put(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/\-rev\/([\w\-\.]+)$/, login, publishable, editable, updatePackage);
  app.put('/:name/-rev/:rev', login, publishable, editable, updatePackage);

  // remove all versions
  app.delete(/^\/(@[\w\-\.]+\/[\w\-\.]+)\/\-rev\/([\w\-\.]+)$/, login, unpublishable, removePackage);
  app.delete('/:name/-rev/:rev', login, unpublishable, removePackage);

  // try to create a new user
  // https://registry.npmjs.org/-/user/org.couchdb.user:fengmk2
  app.put('/-/user/org.couchdb.user::name', addUser);
  app.get('/-/user/org.couchdb.user::name', showUser);
  app.put('/-/user/org.couchdb.user::name/-rev/:rev', login, updateUser);

  // list all packages of user
  app.get('/-/by-user/:user', userPackage.list);
  app.get('/-/users/:user/packages', listPackagesByUser);

  // download times
  app.get('/downloads/range/:range/:name', downloadTotal);
  app.get(/^\/downloads\/range\/([^\/]+)\/(@[\w\-\.]+\/[\w\-\.]+)$/, downloadTotal);
  app.get('/downloads/range/:range', downloadTotal);

  // GET /-/package/:pkg/dependents
  app.get('/-/package/:name/dependents', existsPackage, listDependents);
  app.get(/^\/\-\/package\/(@[\w\-\.]+\/[\w\-\.]+)\/dependents$/, existsPackage, listDependents);

  // GET /-/package/:pkg/dist-tags -- returns the package's dist-tags
  app.get('/-/package/:name/dist-tags', existsPackage, tags.index);
  app.get(/^\/\-\/package\/(@[\w\-\.]+\/[\w\-\.]+)\/dist\-tags$/, existsPackage, tags.index);

  // PUT /-/package/:pkg/dist-tags -- Set package's dist-tags to provided object body (removing missing)
  app.put('/-/package/:name/dist-tags', login, existsPackage, editable, tags.save);
  app.put(/^\/\-\/package\/(@[\w\-\.]+\/[\w\-\.]+)\/dist\-tags$/, login, existsPackage, editable, tags.save);

  // POST /-/package/:pkg/dist-tags -- Add/modify dist-tags from provided object body (merge)
  app.post('/-/package/:name/dist-tags', login, existsPackage, editable, tags.update);
  app.post(/^\/\-\/package\/(@[\w\-\.]+\/[\w\-\.]+)\/dist\-tags$/, login, existsPackage, editable, tags.update);

  // PUT /-/package/:pkg/dist-tags/:tag -- Set package's dist-tags[tag] to provided string body
  app.put('/-/package/:name/dist-tags/:tag', login, existsPackage, editable, tags.set);
  app.put(/^\/\-\/package\/(@[\w\-\.]+\/[\w\-\.]+)\/dist\-tags\/([\w\-\.]+)$/, login, existsPackage, editable, tags.set);
  // POST /-/package/:pkg/dist-tags/:tag -- Same as PUT /-/package/:pkg/dist-tags/:tag
  app.post('/-/package/:name/dist-tags/:tag', login, existsPackage, editable, tags.set);

  // DELETE /-/package/:pkg/dist-tags/:tag -- Remove tag from dist-tags
  app.delete('/-/package/:name/dist-tags/:tag', login, existsPackage, editable, tags.destroy);
  app.delete(/^\/\-\/package\/(@[\w\-\.]+\/[\w\-\.]+)\/dist\-tags\/([\w\-\.]+)$/, login, existsPackage, editable, tags.destroy);
}

module.exports = routes;
