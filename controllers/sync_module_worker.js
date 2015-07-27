/**!
 * cnpmjs.org - controllers/sync_module_worker.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:proxy:sync_module_worker');
var co = require('co');
var gather = require('co-gather');
var defer = require('co-defer');
var thunkify = require('thunkify-wrap');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var sleep = require('co-sleep');
var utility = require('utility');
var urlparse = require('url').parse;
var urllib = require('../common/urllib');
var config = require('../config');
var nfs = require('../common/nfs');
var logger = require('../common/logger');
var common = require('../lib/common');
var npmSerivce = require('../services/npm');
var packageService = require('../services/package');
var logService = require('../services/module_log');
var User = require('../models').User;
var os = require('os');

var USER_AGENT = 'sync.cnpmjs.org/' + config.version +
  ' hostname/' + os.hostname() + ' ' + urllib.USER_AGENT;

function SyncModuleWorker(options) {
  EventEmitter.call(this);
  this._logId = options.logId;
  this._log = '';
  this._loging = false;
  if (!Array.isArray(options.name)) {
    options.name = [options.name];
  }

  this.type = options.type || 'package';
  this.names = options.name;
  this.startName = this.names[0];

  this.username = options.username;
  this.concurrency = options.concurrency || 1;
  this._publish = options.publish === true; // _publish_on_cnpm
  this.syncUpstreamFirst = options.syncUpstreamFirst;

  this.syncingNames = {};
  this.nameMap = {};
  this.names.forEach(function (name) {
    this.nameMap[name] = true;
  }.bind(this));
  this.noDep = options.noDep === true; // do not sync dependences
  this.syncDevDependencies = config.syncDevDependencies;

  this.successes = [];
  this.fails = [];
}

util.inherits(SyncModuleWorker, EventEmitter);

module.exports = SyncModuleWorker;

SyncModuleWorker.prototype.finish = function () {
  debug('syncingNames: %j', this.syncingNames);
  if (this._finished || Object.keys(this.syncingNames).length > 0) {
    return;
  }
  this._finished = true;
  this.log('[done] Sync %s %s finished, %d success, %d fail\nSuccess: [ %s ]\nFail: [ %s ]',
    this.startName,
    this.type,
    this.successes.length, this.fails.length,
    this.successes.join(', '), this.fails.join(', '));
  this.emit('end');
  // make sure all event listeners release
  this.removeAllListeners();
};

// log(format, arg1, arg2, ...)
SyncModuleWorker.prototype.log = function () {
  var str = '[' + utility.YYYYMMDDHHmmss() + '] ' + util.format.apply(util, arguments);
  debug(str);
  var logId = this._logId;
  if (logId) {
    if (this._log) {
      this._log += '\n';
    }
    this._log += str;
    this._saveLog();
  }
};

SyncModuleWorker.prototype._saveLog = function () {
  var that = this;
  if (that._loging) {
    return;
  }
  that._loging = true;
  var logstr = that._log;
  that._log = '';
  co(function* () {
    yield* logService.append(that._logId, logstr);
  }).then(function () {
    that._loging = false;
    if (that._log) {
      that._saveLog();
    }
  }).catch(function (err) {
    logger.error(err);
    that._loging = false;
    if (that._log) {
      that._saveLog();
    }
  });
};

SyncModuleWorker.prototype.start = function () {
  this.log('user: %s, sync %s worker start, %d concurrency, nodeps: %s, publish: %s',
    this.username, this.names[0], this.concurrency, this.noDep, this._publish);
  var that = this;
  co(function* () {
    // sync upstream
    if (that.syncUpstreamFirst) {
      try {
        yield* that.syncUpstream(that.startName);
      } catch (err) {
        logger.error(err);
      }
    }

    if (that.type === 'user') {
      yield that.syncUser();
      return;
    }

    var arr = [];
    for (var i = 0; i < that.concurrency; i++) {
      arr.push(that.next(i));
    }
    yield arr;
  }).catch(function (err) {
    logger.error(err);
  });
};

SyncModuleWorker.prototype.pushSuccess = function (name) {
  this.successes.push(name);
  this.emit('success', name);
};

SyncModuleWorker.prototype.pushFail = function (name) {
  this.fails.push(name);
  this.emit('fail', name);
};

SyncModuleWorker.prototype.add = function (name) {
  if (this.nameMap[name]) {
    return;
  }
  this.nameMap[name] = true;
  this.names.push(name);
  this.emit('add', name);
  this.log('    add dependencies: %s', name);
};

SyncModuleWorker.prototype._doneOne = function* (concurrencyId, name, success) {
  this.log('----------------- Synced %s %s -------------------',
    name, success ? 'success' : 'fail');
  if (success) {
    this.pushSuccess(name);
  } else {
    this.pushFail(name);
  }
  delete this.syncingNames[name];
  var that = this;
  // relase the stack: https://github.com/cnpm/cnpmjs.org/issues/328
  defer.setImmediate(function* () {
    yield* that.next(concurrencyId);
  });
};

SyncModuleWorker.prototype.syncUpstream = function* (name) {
  if (config.sourceNpmRegistry.indexOf('registry.npmjs.org') >= 0 ||
      config.sourceNpmRegistry.indexOf('registry.npmjs.com') >= 0) {
    this.log('----------------- upstream is npm registry: %s, ignore it -------------------', config.sourceNpmRegistry);
    return;
  }
  var syncname = name;
  if (this.type === 'user') {
    syncname = this.type + ':' + syncname;
  }
  var url = config.sourceNpmRegistry + '/' + syncname + '/sync';
  if (this.noDep) {
    url += '?nodeps=true';
  }
  var r = yield urllib.request(url, {
    method: 'put',
    timeout: 20000,
    headers: {
      'content-length': 0
    },
    dataType: 'json',
    gzip: true,
  });

  if (r.status !== 201 || !r.data.ok) {
    return this.log('sync upstream %s error, status: %s, response: %j',
      url, r.status, r.data);
  }

  var logURL = config.sourceNpmRegistry + '/' + name + '/sync/log/' + r.data.logId;
  var offset = 0;
  this.log('----------------- Syncing upstream %s -------------------', logURL);

  var count = 0;
  while (true) {
    count++;
    var synclogURL = logURL + '?offset=' + offset;
    var rs = yield urllib.request(synclogURL, {
      timeout: 20000,
      dataType: 'json',
      gzip: true,
    });

    if (rs.status !== 200 || !rs.data.ok) {
      this.log('sync upstream %s error, status: %s, response: %j',
        synclogURL, rs.status, rs.data);
      break;
    }

    var data = rs.data;
    var syncDone = false;
    if (data.log && data.log.indexOf('[done] Sync') >= 0) {
      syncDone = true;
      data.log = data.log.replace('[done] Sync', '[Upstream done] Sync');
    }

    if (data.log) {
      this.log(data.log);
    }

    if (syncDone) {
      break;
    }

    if (count >= 30) {
      this.log('sync upstream %s fail, give up', logURL);
      break;
    }

    if (data.log) {
      offset += data.log.split('\n').length;
    }

    yield sleep(2000);
  }
  this.log('----------------- Synced upstream %s -------------------', logURL);
};

SyncModuleWorker.prototype.syncUser = function* () {
  for (var i = 0; i < this.names.length; i++) {
    var username = this.names[i];
    try {
      var user = yield _saveNpmUser(username);
      this.pushSuccess(username);
      this.log('[c#%s] [%s] sync success: %j', 0, username, user);
    } catch (err) {
      this.pushFail(username);
      this.log('[c#%s] [error] [%s] sync error: %s', 0, username, err.stack);
    }
  }
  this.finish();
};

SyncModuleWorker.prototype.next = function* (concurrencyId) {
  if (config.syncModel === 'none') {
    this.log('[c#%d] [%s] syncModel is none, ignore',
      concurrencyId, name);
    return this.finish();
  }

  var name = this.names.shift();
  if (!name) {
    return setImmediate(this.finish.bind(this));
  }

  var that = this;
  that.syncingNames[name] = true;
  var pkg = null;
  var status = 0;

  this.log('----------------- Syncing %s -------------------', name);

  // ignore private scoped package
  if (common.isPrivateScopedPackage(name)) {
    this.log('[c#%d] [%s] ignore sync private scoped %j package',
      concurrencyId, name, config.scopes);
    yield* this._doneOne(concurrencyId, name, true);
    return;
  }

  // get from npm
  try {
    var result = yield* npmSerivce.request('/' + name.replace('/', '%2f'));
    pkg = result.data;
    status = result.status;
  } catch (err) {
    // if 404
    if (!err.res || err.res.statusCode !== 404) {
      var errMessage = err.name + ': ' + err.message;
      that.log('[c#%s] [error] [%s] get package error: %s, status: %s',
        concurrencyId, name, errMessage, status);
      yield *that._doneOne(concurrencyId, name, false);
      return;
    }
  }

  var unpublishedInfo = null;
  if (status === 404) {
    // check if it's unpublished
    if (pkg.time && pkg.time.unpublished && pkg.time.unpublished.time) {
      unpublishedInfo = pkg.time.unpublished;
    } else {
      pkg = null;
    }
  }

  if (!pkg) {
    that.log('[c#%s] [error] [%s] get package error: package not exists, status: %s',
      concurrencyId, name, status);
    yield* that._doneOne(concurrencyId, name, true);
    return;
  }

  that.log('[c#%d] [%s] pkg status: %d, start...', concurrencyId, name, status);

  if (unpublishedInfo) {
    try {
      yield* that._unpublished(name, unpublishedInfo);
    } catch (err) {
      that.log('[c#%s] [error] [%s] sync error: %s', concurrencyId, name, err.stack);
      yield* that._doneOne(concurrencyId, name, false);
      return;
    }
    return yield* that._doneOne(concurrencyId, name, true);
  }

  var versions;
  try {
    versions = yield* that._sync(name, pkg);
  } catch (err) {
    that.log('[c#%s] [error] [%s] sync error: %s', concurrencyId, name, err.stack);
    yield* that._doneOne(concurrencyId, name, false);
    return;
  }

  this.log('[c#%d] [%s] synced success, %d versions: %s',
    concurrencyId, name, versions.length, versions.join(', '));
  yield* this._doneOne(concurrencyId, name, true);
};

function* _listStarUsers(modName) {
  var users = yield* packageService.listStarUserNames(modName);
  var userMap = {};
  users.forEach(function (user) {
    userMap[user] = true;
  });
  return userMap;
}

function* _saveNpmUser(username) {
  var user = yield* npmSerivce.getUser(username);
  if (!user) {
    return;
  }
  yield* User.saveNpmUser(user);
  return user;
}

function* _saveMaintainer(modName, username, action) {
  if (action === 'add') {
    yield* packageService.addPublicModuleMaintainer(modName, username);
  } else if (action === 'remove') {
    yield* packageService.removePublicModuleMaintainer(modName, username);
  }
}

SyncModuleWorker.prototype._unpublished = function* (name, unpublishedInfo) {
  var mods = yield* packageService.listModulesByName(name);
  this.log('  [%s] start unpublished %d versions from local cnpm registry',
    name, mods.length);
  if (common.isLocalModule(mods)) {
    // publish on cnpm, dont sync this version package
    this.log('  [%s] publish on local cnpm registry, don\'t sync', name);
    return [];
  }

  var r = yield* packageService.saveUnpublishedModule(name, unpublishedInfo);
  this.log('    [%s] save unpublished info: %j to row#%s',
    name, unpublishedInfo, r.id);
  if (mods.length === 0) {
    return;
  }
  yield [packageService.removeModulesByName(name), packageService.removeModuleTags(name)];
  var keys = [];
  for (var i = 0; i < mods.length; i++) {
    var row = mods[i];
    var dist = row.package.dist;
    var key = dist.key;
    if (!key) {
      key = urlparse(dist.tarball).pathname;
    }
    key && keys.push(key);
  }

  if (keys.length > 0) {
    try {
      yield keys.map(function (key) {
        return nfs.remove(key);
      });
    } catch (err) {
      // ignore error here
      this.log('    [%s] delete nfs files: %j error: %s: %s',
        name, keys, err.name, err.message);
    }
  }
  this.log('    [%s] delete nfs files: %j success', name, keys);
};

SyncModuleWorker.prototype._sync = function* (name, pkg) {
  var that = this;
  var hasModules = false;
  var result = yield [
    packageService.listModulesByName(name),
    packageService.listModuleTags(name),
    _listStarUsers(name),
    packageService.listPublicModuleMaintainers(name),
  ];
  var moduleRows = result[0];
  var tagRows = result[1];
  var existsStarUsers = result[2];
  var existsNpmMaintainers = result[3];

  if (common.isLocalModule(moduleRows)) {
    // publish on cnpm, dont sync this version package
    that.log('  [%s] publish on local cnpm registry, don\'t sync', name);
    return [];
  }

  hasModules = moduleRows.length > 0;
  var map = {};
  var localVersionNames = [];
  for (var i = 0; i < moduleRows.length; i++) {
    var r = moduleRows[i];
    if (!r.package || !r.package.dist) {
      // package json parse error
      continue;
    }
    if (!map.latest) {
      map.latest = r;
    }
    map[r.version] = r;
    localVersionNames.push(r.version);
  }

  var tags = {};
  for (var i = 0; i < tagRows.length; i++) {
    var r = tagRows[i];
    if (!r.module_id) {
      // no module_id, need to sync tags
      continue;
    }
    tags[r.tag] = r.version;
  }

  var missingVersions = [];
  var missingTags = [];
  var missingDescriptions = [];
  var missingReadmes = [];
  var missingStarUsers = [];
  var npmUsernames = {};
  var missingDeprecateds = [];
  // [[user, 'add or remove'], ...]
  var diffNpmMaintainers = [];

  // find out new maintainers
  var pkgMaintainers = pkg.maintainers || [];
  if (Array.isArray(pkgMaintainers)) {
    var existsMap = {};
    var originalMap = {};
    for (var i = 0; i < existsNpmMaintainers.length; i++) {
      var user = existsNpmMaintainers[i];
      existsMap[user] = true;
    }
    for (var i = 0; i < pkgMaintainers.length; i++) {
      var item = pkgMaintainers[i];
      originalMap[item.name] = item;
      npmUsernames[item.name.toLowerCase()] = 1;
    }

    // find add users
    for (var i = 0; i < pkgMaintainers.length; i++) {
      var item = pkgMaintainers[i];
      if (!existsMap[item.name]) {
        diffNpmMaintainers.push([item.name, 'add']);
      }
    }

    // find remove users
    for (var i = 0; i < existsNpmMaintainers.length; i++) {
      var user = existsNpmMaintainers[i];
      if (!originalMap[user]) {
        diffNpmMaintainers.push([user, 'remove']);
      }
    }
  }

  // find out all user names
  for (var v in pkg.versions) {
    var p = pkg.versions[v];
    var maintainers = p.maintainers || [];
    if (!Array.isArray(maintainers)) {
      // http://r.cnpmjs.org/jasmine-node
      // TODO: "maintainers": "Martin H膫陇ger <martin.haeger@gmail.com>",
      maintainers = [maintainers];
    }
    for (var i = 0; i < maintainers.length; i++) {
      var m = maintainers[i];
      if (m.name) {
        npmUsernames[m.name.toLowerCase()] = 1;
      }
    }
  }

  // get the missing star users
  var starUsers = pkg.users || {};
  for (var k in starUsers) {
    if (!existsStarUsers[k]) {
      missingStarUsers.push(k);
    }
    npmUsernames[k.toLowerCase()] = 1;
  }
  that.log('  [%s] found %d missing star users', name, missingStarUsers.length);

  var times = pkg.time || {};
  pkg.versions = pkg.versions || {};
  var remoteVersionNames = Object.keys(pkg.versions);
  var remoteVersionNameMap = {};

  // find out missing versions
  for (var i = 0; i < remoteVersionNames.length; i++) {
    var v = remoteVersionNames[i];
    remoteVersionNameMap[v] = v;
    var exists = map[v] || {};
    var version = pkg.versions[v];
    if (!version || !version.dist || !version.dist.tarball) {
      continue;
    }
    //patch for readme
    if (!version.readme) {
      version.readme = pkg.readme;
    }
    var publish_time = times[v];
    version.publish_time = publish_time ? Date.parse(publish_time) : null;
    if (!version.maintainers || !version.maintainers[0]) {
      version.maintainers = pkg.maintainers;
    }
    if (exists.package &&
        exists.package.dist.shasum === version.dist.shasum) {
      // * shasum make sure equal
      if ((version.publish_time === exists.publish_time) ||
          (!version.publish_time && exists.publish_time)) {
        // debug('  [%s] %s publish_time equal: %s, %s',
        //   name, version.version, version.publish_time, exists.publish_time);
        // * publish_time make sure equal
        if (exists.description === null && version.description) {
          // * make sure description exists
          missingDescriptions.push({
            id: exists.id,
            description: version.description
          });
        }

        if (!exists.package.readme && version.readme) {
          // * make sure readme exists
          missingReadmes.push({
            id: exists.id,
            readme: version.readme
          });
        }

        if (version.deprecated && version.deprecated !== exists.package.deprecated) {
          // need to sync deprecated field
          missingDeprecateds.push({
            id: exists.id,
            deprecated: version.deprecated
          });
        }
        continue;
      }
    }
    missingVersions.push(version);
  }

  // find out deleted versions
  var deletedVersionNames = [];
  for (var i = 0; i < localVersionNames.length; i++) {
    var v = localVersionNames[i];
    if (!remoteVersionNameMap[v]) {
      deletedVersionNames.push(v);
    }
  }

  // find out missing tags
  var sourceTags = pkg['dist-tags'] || {};
  for (var t in sourceTags) {
    var sourceTagVersion = sourceTags[t];
    if (sourceTagVersion && tags[t] !== sourceTagVersion) {
      missingTags.push([t, sourceTagVersion]);
    }
  }
  // find out deleted tags
  var deletedTags = [];
  for (var t in tags) {
    if (!sourceTags[t]) {
      // not in remote tags, delete it from local registry
      deletedTags.push(t);
    }
  }

  if (missingVersions.length === 0) {
    that.log('  [%s] all versions are exists', name);
  } else {
    missingVersions.sort(function (a, b) {
      return a.publish_time - b.publish_time;
    });
    that.log('  [%s] %d versions need to sync', name, missingVersions.length);
  }

  var syncedVersionNames = [];
  var syncIndex = 0;

  // sync missing versions
  while (missingVersions.length) {
    var index = syncIndex++;
    var syncModule = missingVersions.shift();
    if (!syncModule.dist.tarball) {
      continue;
    }
    try {
      yield* that._syncOneVersion(index, syncModule);
      syncedVersionNames.push(syncModule.version);
    } catch (err) {
      that.log('    [%s:%d] sync error, version: %s, %s: %s',
        syncModule.name, index, syncModule.version, err.name, err.stack);
    }
  }


  if (deletedVersionNames.length === 0) {
    that.log('  [%s] no versions need to deleted', name);
  } else {
    that.log('  [%s] %d versions: %j need to deleted',
      name, deletedVersionNames.length, deletedVersionNames);
    try {
      yield* packageService.removeModulesByNameAndVersions(name, deletedVersionNames);
    } catch (err) {
      that.log('    [%s] delete error, %s: %s', name, err.name, err.message);
    }
  }

  // sync missing descriptions
  function* syncDes() {
    if (missingDescriptions.length === 0) {
      return;
    }
    that.log('  [%s] saving %d descriptions', name, missingDescriptions.length);
    var res = yield gather(missingDescriptions.map(function (item) {
      return packageService.updateModuleDescription(item.id, item.description);
    }));

    for (var i = 0; i < res.length; i++) {
      var item = missingDescriptions[i];
      var r = res[i];
      if (r.error) {
        that.log('    save error, id: %s, description: %s, error: %s',
          item.id, item.description, r.error.message);
      } else {
        that.log('    saved, id: %s, description length: %d',
          item.id, item.description.length);
      }
    }
  }

  // sync missing tags
  function* syncTag() {
    if (deletedTags.length > 0) {
      yield* packageService.removeModuleTagsByNames(name, deletedTags);
      that.log('  [%s] deleted %d tags: %j',
        name, deletedTags.length, deletedTags);
    }

    if (missingTags.length === 0) {
      return;
    }
    that.log('  [%s] adding %d tags', name, missingTags.length);
    // sync tags
    var res = yield gather(missingTags.map(function (item) {
      return packageService.addModuleTag(name, item[0], item[1]);
    }));

    for (var i = 0; i < res.length; i++) {
      var item = missingTags[i];
      var r = res[i];
      if (r.error) {
        that.log('    add tag %s:%s error, error: %s',
          item.id, item.description, r.error.message);
      } else {
        that.log('    added tag %s:%s, module_id: %s',
          item[0], item[1], r.value && r.value.module_id);
      }
    }
  }

  // sycn missing readme
  function* syncReadme() {
    if (missingReadmes.length === 0) {
      return;
    }
    that.log('  [%s] saving %d readmes', name, missingReadmes.length);

    var res = yield gather(missingReadmes.map(function (item) {
      return packageService.updateModuleReadme(item.id, item.readme);
    }));

    for (var i = 0; i < res.length; i++) {
      var item = missingReadmes[i];
      var r = res[i];
      if (r.error) {
        that.log('    save error, id: %s, error: %s', item.id, r.error.message);
      } else {
        that.log('    saved, id: %s', item.id);
      }
    }
  }

  function *syncDeprecateds() {
    if (missingDeprecateds.length === 0) {
      return;
    }
    that.log('  [%s] saving %d Deprecated fields', name, missingDeprecateds.length);

    var res = yield gather(missingDeprecateds.map(function (item) {
      return packageService.updateModulePackageFields(item.id, {
        deprecated: item.deprecated
      });
    }));

    for (var i = 0; i < res.length; i++) {
      var item = missingDeprecateds[i];
      var r = res[i];
      if (r.error) {
        that.log('    save error, id: %s, error: %s', item.id, r.error.message);
      } else {
        that.log('    saved, id: %s', item.id);
      }
    }
  }

  function* syncMissingUsers() {
    var missingUsers = [];
    var names = Object.keys(npmUsernames);
    if (names.length === 0) {
      return;
    }
    var rows = yield* User.listByNames(names);
    var map = {};
    rows.forEach(function (r) {
      map[r.name] = r;
    });
    names.forEach(function (username) {
      var r = map[username];
      if (!r || !r.json) {
        if (username[0] !== '"' && username[0] !== "'") {
          missingUsers.push(username);
        }
      }
    });

    if (missingUsers.length === 0) {
      that.log('  [%s] all %d npm users exists', name, names.length);
      return;
    }

    that.log('  [%s] saving %d/%d missing npm users: %j',
      name, missingUsers.length, names.length, missingUsers);
    var res = yield gather(missingUsers.map(function (username) {
      return _saveNpmUser(username);
    }));

    for (var i = 0; i < res.length; i++) {
      var r = res[i];
      if (r.error) {
        that.log('    save npm user error, %s', r.error.message);
      }
    }
  }

  // sync missing star users
  function* syncMissingStarUsers() {
    if (missingStarUsers.length === 0) {
      return;
    }

    that.log('  [%s] saving %d star users', name, missingStarUsers.length);
    var res = yield gather(missingStarUsers.map(function (username) {
      return packageService.addStar(name, username);
    }));

    for (var i = 0; i < res.length; i++) {
      var r = res[i];
      if (r.error) {
        that.log('    add star user error, %s', r.error.stack);
      }
    }
  }

  // sync diff npm package maintainers
  function* syncNpmPackageMaintainers() {
    if (diffNpmMaintainers.length === 0) {
      return;
    }

    that.log('  [%s] syncing %d diff package maintainers: %j',
      name, diffNpmMaintainers.length, diffNpmMaintainers);
    var res = yield gather(diffNpmMaintainers.map(function (item) {
      return _saveMaintainer(name, item[0], item[1]);
    }));

    for (var i = 0; i < res.length; i++) {
      var r = res[i];
      if (r.error) {
        that.log('    save package maintainer error, %s', r.error.stack);
      }
    }
  }

  yield [
    syncDes(),
    syncTag(),
    syncReadme(),
    syncDeprecateds(),
    syncMissingStarUsers(),
    syncMissingUsers(),
    syncNpmPackageMaintainers(),
  ];
  return syncedVersionNames;
};

SyncModuleWorker.prototype._syncOneVersion = function *(versionIndex, sourcePackage) {
  var that = this;
  var username = this.username;
  var downurl = sourcePackage.dist.tarball;
  var filename = path.basename(downurl);
  var filepath = common.getTarballFilepath(filename);
  var ws = fs.createWriteStream(filepath);

  var options = {
    writeStream: ws,
    followRedirect: true,
    timeout: 600000, // 10 minutes download
    headers: {
      'user-agent': USER_AGENT
    },
    gzip: true,
  };

  var dependencies = Object.keys(sourcePackage.dependencies || {});
  var devDependencies = [];
  if (this.syncDevDependencies) {
    devDependencies = Object.keys(sourcePackage.devDependencies || {});
  }

  that.log('    [%s:%d] syncing, version: %s, dist: %j, no deps: %s, ' +
   'publish on cnpm: %s, dependencies: %d, devDependencies: %d, syncDevDependencies: %s',
    sourcePackage.name, versionIndex, sourcePackage.version,
    sourcePackage.dist, that.noDep, that._publish,
    dependencies.length,
    devDependencies.length, this.syncDevDependencies);

  if (dependencies.length > config.maxDependencies) {
    dependencies = dependencies.slice(0, config.maxDependencies);
  }

  if (devDependencies.length > config.maxDependencies) {
    devDependencies = devDependencies.slice(0, config.maxDependencies);
  }

  if (!that.noDep) {
    for (var i = 0; i < dependencies.length; i++) {
      that.add(dependencies[i]);
    }

    for (var i = 0; i < devDependencies.length; i++) {
      that.add(devDependencies[i]);
    }
  }

  // add module dependence
  yield* packageService.addDependencies(sourcePackage.name, dependencies);

  var shasum = crypto.createHash('sha1');
  var dataSize = 0;

  try {
    // get tarball
    var r = yield urllib.request(downurl, options);
    var statusCode = r.status || -1;
    // https://github.com/cnpm/cnpmjs.org/issues/325
    // if (statusCode === 404) {
    //   shasum = sourcePackage.dist.shasum;
    //   return yield *afterUpload({
    //     url: downurl
    //   });
    // }

    if (statusCode !== 200) {
      var err = new Error('Download ' + downurl + ' fail, status: ' + statusCode);
      err.name = 'DownloadTarballError';
      err.data = sourcePackage;
      throw err;
    }

    // read and check
    var rs = fs.createReadStream(filepath);
    rs.on('data', function (data) {
      shasum.update(data);
      dataSize += data.length;
    });
    var end = thunkify.event(rs);
    yield end(); // after end event emit

    if (dataSize === 0) {
      var err = new Error('Download ' + downurl + ' file size is zero');
      err.name = 'DownloadTarballSizeZeroError';
      err.data = sourcePackage;
      throw err;
    }

    // check shasum
    shasum = shasum.digest('hex');
    if (shasum !== sourcePackage.dist.shasum) {
      var err = new Error('Download ' + downurl + ' shasum:' + shasum +
        ' not match ' + sourcePackage.dist.shasum);
      err.name = 'DownloadTarballShasumError';
      err.data = sourcePackage;
      throw err;
    }

    options = {
      key: common.getCDNKey(sourcePackage.name, filename),
      size: dataSize,
      shasum: shasum
    };
    // upload to NFS
    logger.syncInfo('[sync_module_worker] uploading %j to nfs', options);
    var result = yield nfs.upload(filepath, options);
    return yield *afterUpload(result);
  } finally {
    // remove tmp file whatever
    fs.unlink(filepath, utility.noop);
  }

  function *afterUpload(result) {
    //make sure sync module have the correct author info
    //only if can not get maintainers, use the username
    var author = username;
    if (Array.isArray(sourcePackage.maintainers)) {
      author = sourcePackage.maintainers[0].name || username;
    }

    var mod = {
      version: sourcePackage.version,
      name: sourcePackage.name,
      package: sourcePackage,
      author: author,
      publish_time: sourcePackage.publish_time,
    };

    // delete _publish_on_cnpm, because other cnpm maybe sync from current cnpm
    delete mod.package._publish_on_cnpm;
    if (that._publish) {
      // sync as publish
      mod.package._publish_on_cnpm = true;
    }

    var dist = {
      shasum: shasum,
      size: dataSize,
      noattachment: dataSize === 0,
    };

    if (result.url) {
      dist.tarball = result.url;
    } else if (result.key) {
      dist.key = result.key;
      dist.tarball = result.key;
    }

    mod.package.dist = dist;
    var r = yield* packageService.saveModule(mod);

    that.log('    [%s:%s] done, insertId: %s, author: %s, version: %s, '
      + 'size: %d, publish_time: %j, publish on cnpm: %s',
      sourcePackage.name, versionIndex,
      r.id,
      author, mod.version, dataSize,
      new Date(mod.publish_time),
      that._publish);

    return r;
  }
};

SyncModuleWorker.sync = function* (name, username, options) {
  options = options || {};
  var result = yield* logService.create({name: name, username: username});
  var worker = new SyncModuleWorker({
    logId: result.id,
    type: options.type,
    name: name,
    username: username,
    noDep: options.noDep,
    publish: options.publish,
    syncUpstreamFirst: options.syncUpstreamFirst,
  });
  worker.start();
  return result.id;
};
