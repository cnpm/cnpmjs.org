'use strict';

const debug = require('debug')('cnpmjs.org:sync_module_worker');
const co = require('co');
const gather = require('co-gather');
const defer = require('co-defer');
const thunkify = require('thunkify-wrap');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sleep = require('ko-sleep');
const utility = require('utility');
const urlparse = require('url').parse;
const urllib = require('../common/urllib');
const config = require('../config');
const nfs = require('../common/nfs');
const logger = require('../common/logger');
const common = require('../lib/common');
const npmSerivce = require('../services/npm');
const packageService = require('../services/package');
const logService = require('../services/module_log');
const User = require('../models').User;
const os = require('os');

const USER_AGENT = 'sync.cnpmjs.org/' + config.version +
  ' hostname/' + os.hostname() +
  ' syncModel/' + config.syncModel +
  ' syncInterval/' + config.syncInterval +
  ' syncConcurrency/' + config.syncConcurrency +
  ' ' + urllib.USER_AGENT;

function SyncModuleWorker(options) {
  EventEmitter.call(this);
  this._logId = options.logId;
  this._log = '';
  this._loging = false;
  if (!Array.isArray(options.name)) {
    options.name = [ options.name ];
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
  this.names.forEach(function(name) {
    this.nameMap[name] = true;
  }.bind(this));
  this.noDep = options.noDep === true; // do not sync dependences
  this.syncDevDependencies = config.syncDevDependencies;

  this.successes = [];
  this.fails = [];
  this.updates = [];
}

util.inherits(SyncModuleWorker, EventEmitter);

module.exports = SyncModuleWorker;

SyncModuleWorker.prototype.finish = function() {
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
SyncModuleWorker.prototype.log = function() {
  const str = '[' + utility.YYYYMMDDHHmmss() + '] ' + util.format.apply(util, arguments);
  debug(str);
  const logId = this._logId;
  if (logId) {
    if (this._log) {
      this._log += '\n';
    }
    this._log += str;
    this._saveLog();
  }
};

SyncModuleWorker.prototype._saveLog = function() {
  const that = this;
  if (that._loging) {
    return;
  }
  that._loging = true;
  const logstr = that._log;
  that._log = '';
  co(function* () {
    yield logService.append(that._logId, logstr);
  }).then(function() {
    that._loging = false;
    if (that._log) {
      that._saveLog();
    }
  }).catch(function(err) {
    logger.error(err);
    that._loging = false;
    if (that._log) {
      that._saveLog();
    }
  });
};

SyncModuleWorker.prototype.start = function() {
  this.log('user: %s, sync %s worker start, %d concurrency, nodeps: %s, publish: %s',
    this.username, this.names[0], this.concurrency, this.noDep, this._publish);
  const that = this;
  co(function* () {
    // sync upstream
    if (that.syncUpstreamFirst) {
      try {
        yield that.syncUpstream(that.startName);
      } catch (err) {
        logger.error(err);
      }
    }

    if (that.type === 'user') {
      yield that.syncUser();
      return;
    }

    const arr = [];
    for (let i = 0; i < that.concurrency; i++) {
      arr.push(that.next(i));
    }
    yield arr;
  }).catch(function(err) {
    logger.error(err);
  });
};

SyncModuleWorker.prototype.pushSuccess = function(name) {
  this.successes.push(name);
  this.emit('success', name);
};

SyncModuleWorker.prototype.pushFail = function(name) {
  this.fails.push(name);
  this.emit('fail', name);
};

SyncModuleWorker.prototype.add = function(name) {
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
  const that = this;
  // relase the stack: https://github.com/cnpm/cnpmjs.org/issues/328
  defer.setImmediate(function* () {
    yield that.next(concurrencyId);
  });
};

SyncModuleWorker.prototype.syncUpstream = function* (name) {
  if (config.sourceNpmRegistry.indexOf('registry.npmjs.org') >= 0 ||
      config.sourceNpmRegistry.indexOf('registry.npmjs.com') >= 0 ||
      config.sourceNpmRegistry.indexOf('replicate.npmjs.com') >= 0) {
    this.log('----------------- upstream is npm registry: %s, ignore it -------------------',
      config.sourceNpmRegistry);
    return;
  }
  let syncname = name;
  if (this.type === 'user') {
    syncname = this.type + ':' + syncname;
  }
  let url = config.sourceNpmRegistry + '/' + syncname + '/sync';
  if (this.noDep) {
    url += '?nodeps=true';
  }
  const r = yield urllib.request(url, {
    method: 'put',
    timeout: 20000,
    headers: {
      'content-length': 0,
    },
    dataType: 'json',
    gzip: true,
  });

  if (r.status !== 201 || !r.data.ok) {
    return this.log('sync upstream %s error, status: %s, response: %j',
      url, r.status, r.data);
  }

  const logURL = config.sourceNpmRegistry + '/' + name + '/sync/log/' + r.data.logId;
  let offset = 0;
  this.log('----------------- Syncing upstream %s -------------------', logURL);

  let count = 0;
  /* eslint no-constant-condition: 0 */
  while (true) {
    count++;
    const synclogURL = logURL + '?offset=' + offset;
    const rs = yield urllib.request(synclogURL, {
      timeout: 20000,
      dataType: 'json',
      gzip: true,
    });

    if (rs.status !== 200 || !rs.data.ok) {
      this.log('sync upstream %s error, status: %s, response: %j',
        synclogURL, rs.status, rs.data);
      break;
    }

    const data = rs.data;
    let syncDone = false;
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
  for (let i = 0; i < this.names.length; i++) {
    const username = this.names[i];
    try {
      const user = yield _saveNpmUser(username);
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
  const name = this.names.shift();
  if (!name) {
    return setImmediate(this.finish.bind(this));
  }

  if (config.syncModel === 'none') {
    this.log('[c#%d] [%s] syncModel is none, ignore',
      concurrencyId, name);
    return this.finish();
  }

  const that = this;
  that.syncingNames[name] = true;
  let pkg = null;
  let status = 0;

  this.log('----------------- Syncing %s -------------------', name);

  // ignore private scoped package
  if (common.isPrivateScopedPackage(name)) {
    this.log('[c#%d] [%s] ignore sync private scoped %j package',
      concurrencyId, name, config.scopes);
    yield this._doneOne(concurrencyId, name, true);
    return;
  }

  // get from npm
  const packageUrl = '/' + name.replace('/', '%2f');
  // try to sync from official replicate when source npm registry is not cnpmjs.org
  const registry = config.sourceNpmRegistryIsCNpm ? config.sourceNpmRegistry : config.officialNpmReplicate;
  try {
    const result = yield npmSerivce.request(packageUrl, { registry });
    pkg = result.data;
    status = result.status;
  } catch (err) {
    // if 404
    if (!err.res || err.res.statusCode !== 404) {
      const errMessage = err.name + ': ' + err.message;
      that.log('[c#%s] [error] [%s] get package(%s%s) error: %s, status: %s',
        concurrencyId, name, registry, packageUrl, errMessage, status);
      yield that._doneOne(concurrencyId, name, false);
      return;
    }
  }

  let unpublishedInfo = null;
  if (status === 404) {
    // check if it's unpublished
    // ignore too long package name, see https://github.com/cnpm/cnpmjs.org/issues/1066
    if (name.length < 80 && pkg && pkg.time && pkg.time.unpublished && pkg.time.unpublished.time) {
      unpublishedInfo = pkg.time.unpublished;
    } else {
      pkg = null;
    }
  }

  if (!pkg) {
    that.log('[c#%s] [error] [%s] get package(%s%s) error: package not exists, status: %s',
      concurrencyId, name, registry, packageUrl, status);
    yield that._doneOne(concurrencyId, name, true);
    return;
  }

  that.log('[c#%d] [%s] package(%s%s) status: %s, dist-tags: %j, time.modified: %s, start...',
    concurrencyId, name, registry, packageUrl, status, pkg['dist-tags'], pkg.time && pkg.time.modified);

  if (unpublishedInfo) {
    try {
      yield that._unpublished(name, unpublishedInfo);
    } catch (err) {
      that.log('[c#%s] [error] [%s] sync error: %s', concurrencyId, name, err.stack);
      yield that._doneOne(concurrencyId, name, false);
      return;
    }
    return yield that._doneOne(concurrencyId, name, true);
  }

  let versions;
  try {
    versions = yield that._sync(name, pkg);
  } catch (err) {
    that.log('[c#%s] [error] [%s] sync error: %s', concurrencyId, name, err.stack);
    yield that._doneOne(concurrencyId, name, false);
    return;
  }

  // has new version
  if (versions.length > 0) {
    that.updates.push(name);
  }

  this.log('[c#%d] [%s] synced success, %d versions: %s',
    concurrencyId, name, versions.length, versions.join(', '));
  yield this._doneOne(concurrencyId, name, true);
};

function* _listStarUsers(modName) {
  const users = yield packageService.listStarUserNames(modName);
  const userMap = {};
  users.forEach(function(user) {
    userMap[user] = true;
  });
  return userMap;
}

function* _saveNpmUser(username) {
  const user = yield npmSerivce.getUser(username);
  if (!user) {
    const existsUser = yield User.findByName(username);
    if (existsUser && existsUser.isNpmUser) {
      // delete it
      yield User.destroy({
        where: {
          name: username,
        },
      });
      return { exists: true, deleted: true, isNpmUser: true };
    }
    return { exists: false };
  }
  yield User.saveNpmUser(user);
  return user;
}

function* _saveMaintainer(modName, username, action) {
  if (action === 'add') {
    yield packageService.addPublicModuleMaintainer(modName, username);
  } else if (action === 'remove') {
    yield packageService.removePublicModuleMaintainer(modName, username);
  }
}

SyncModuleWorker.prototype._unpublished = function* (name, unpublishedInfo) {
  const mods = yield packageService.listModulesByName(name);
  this.log('  [%s] start unpublished %d versions from local cnpm registry',
    name, mods.length);
  if (common.isLocalModule(mods)) {
    // publish on cnpm, dont sync this version package
    this.log('  [%s] publish on local cnpm registry, don\'t sync', name);
    return [];
  }

  const r = yield packageService.saveUnpublishedModule(name, unpublishedInfo);
  this.log('    [%s] save unpublished info: %j to row#%s',
    name, unpublishedInfo, r.id);
  if (mods.length === 0) {
    return;
  }
  yield [ packageService.removeModulesByName(name), packageService.removeModuleTags(name) ];
  const keys = [];
  for (let i = 0; i < mods.length; i++) {
    const row = mods[i];
    const dist = row.package.dist;
    let key = dist.key;
    if (!key) {
      key = urlparse(dist.tarball).pathname;
    }
    key && keys.push(key);
  }

  if (keys.length > 0) {
    try {
      yield keys.map(function(key) {
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
  const that = this;
  const result = yield [
    packageService.listModulesByName(name),
    packageService.listModuleTags(name),
    _listStarUsers(name),
    packageService.listPublicModuleMaintainers(name),
  ];
  const moduleRows = result[0];
  const tagRows = result[1];
  const existsStarUsers = result[2];
  const existsNpmMaintainers = result[3];

  if (common.isLocalModule(moduleRows)) {
    // publish on cnpm, dont sync this version package
    that.log('  [%s] publish on local cnpm registry, don\'t sync', name);
    return [];
  }

  const map = {};
  const localVersionNames = [];
  for (let i = 0; i < moduleRows.length; i++) {
    const r = moduleRows[i];
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

  const tags = {};
  for (let i = 0; i < tagRows.length; i++) {
    const r = tagRows[i];
    if (!r.module_id) {
      // no module_id, need to sync tags
      continue;
    }
    tags[r.tag] = r.version;
  }

  const missingVersions = [];
  const missingTags = [];
  const missingDescriptions = [];
  const missingReadmes = [];
  const missingStarUsers = [];
  const npmUsernames = {};
  const missingDeprecateds = [];
  // [[user, 'add or remove'], ...]
  const diffNpmMaintainers = [];

  // find out new maintainers
  const pkgMaintainers = pkg.maintainers || [];
  if (Array.isArray(pkgMaintainers)) {
    const existsMap = {};
    const originalMap = {};
    for (const user of existsNpmMaintainers) {
      existsMap[user] = true;
    }
    for (const item of pkgMaintainers) {
      originalMap[item.name] = item;
      npmUsernames[item.name.toLowerCase()] = 1;
    }

    // find add users
    for (const item of pkgMaintainers) {
      if (!existsMap[item.name]) {
        diffNpmMaintainers.push([ item.name, 'add' ]);
      }
    }

    // find remove users
    for (const user of existsNpmMaintainers) {
      if (!originalMap[user]) {
        diffNpmMaintainers.push([ user, 'remove' ]);
      }
    }
  }

  // find out all user names
  for (const v in pkg.versions) {
    const p = pkg.versions[v];
    let maintainers = p.maintainers || [];
    if (!Array.isArray(maintainers)) {
      // http://r.cnpmjs.org/jasmine-node
      // TODO: "maintainers": "Martin H膫陇ger <martin.haeger@gmail.com>",
      maintainers = [ maintainers ];
    }
    for (const m of maintainers) {
      if (m.name) {
        npmUsernames[m.name.toLowerCase()] = 1;
      }
    }
  }

  // get the missing star users
  const starUsers = pkg.users || {};
  for (const k in starUsers) {
    if (!existsStarUsers[k]) {
      missingStarUsers.push(k);
    }
    npmUsernames[k.toLowerCase()] = 1;
  }
  that.log('  [%s] found %d missing star users', name, missingStarUsers.length);

  const times = pkg.time || {};
  pkg.versions = pkg.versions || {};
  const remoteVersionNames = Object.keys(pkg.versions);
  const remoteVersionNameMap = {};

  // find out missing versions
  for (const v of remoteVersionNames) {
    remoteVersionNameMap[v] = v;
    const exists = map[v] || {};
    const version = pkg.versions[v];
    if (!version || !version.dist || !version.dist.tarball) {
      continue;
    }
    // patch for readme
    if (!version.readme) {
      version.readme = pkg.readme;
    }
    const publish_time = times[v];
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
            description: version.description,
          });
        }

        if (!exists.package.readme && version.readme) {
          // * make sure readme exists
          missingReadmes.push({
            id: exists.id,
            readme: version.readme,
          });
        }

        if (version.deprecated && version.deprecated !== exists.package.deprecated) {
          // need to sync deprecated field
          missingDeprecateds.push({
            id: exists.id,
            deprecated: version.deprecated,
          });
        }
        if (exists.package.deprecated && !version.deprecated) {
          // remove deprecated info
          missingDeprecateds.push({
            id: exists.id,
            deprecated: undefined,
          });
        }
        continue;
      }
    }
    missingVersions.push(version);
  }

  // find out deleted versions
  const deletedVersionNames = [];
  for (const v of localVersionNames) {
    if (!remoteVersionNameMap[v]) {
      deletedVersionNames.push(v);
    }
  }

  // find out missing tags
  const sourceTags = pkg['dist-tags'] || {};
  for (const t in sourceTags) {
    const sourceTagVersion = sourceTags[t];
    if (sourceTagVersion && tags[t] !== sourceTagVersion) {
      missingTags.push([ t, sourceTagVersion ]);
    }
  }
  // find out deleted tags
  const deletedTags = [];
  for (const t in tags) {
    if (!sourceTags[t]) {
      // not in remote tags, delete it from local registry
      deletedTags.push(t);
    }
  }

  if (missingVersions.length === 0) {
    that.log('  [%s] all versions are exists', name);
  } else {
    missingVersions.sort(function(a, b) {
      return a.publish_time - b.publish_time;
    });
    that.log('  [%s] %d versions need to sync', name, missingVersions.length);
  }

  const syncedVersionNames = [];
  let syncIndex = 0;

  // sync missing versions
  while (missingVersions.length) {
    const index = syncIndex++;
    const syncModule = missingVersions.shift();
    if (!syncModule.dist.tarball) {
      continue;
    }
    try {
      yield that._syncOneVersion(index, syncModule);
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
      yield packageService.removeModulesByNameAndVersions(name, deletedVersionNames);
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
    const res = yield gather(missingDescriptions.map(function(item) {
      return packageService.updateModuleDescription(item.id, item.description);
    }));

    for (let i = 0; i < res.length; i++) {
      const item = missingDescriptions[i];
      const r = res[i];
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
      yield packageService.removeModuleTagsByNames(name, deletedTags);
      that.log('  [%s] deleted %d tags: %j',
        name, deletedTags.length, deletedTags);
    }

    if (missingTags.length === 0) {
      return;
    }
    that.log('  [%s] adding %d tags', name, missingTags.length);
    // sync tags
    const res = yield gather(missingTags.map(function(item) {
      return packageService.addModuleTag(name, item[0], item[1]);
    }));

    for (let i = 0; i < res.length; i++) {
      const item = missingTags[i];
      const r = res[i];
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

    const res = yield gather(missingReadmes.map(function(item) {
      return packageService.updateModuleReadme(item.id, item.readme);
    }));

    for (let i = 0; i < res.length; i++) {
      const item = missingReadmes[i];
      const r = res[i];
      if (r.error) {
        that.log('    save error, id: %s, error: %s', item.id, r.error.message);
      } else {
        that.log('    saved, id: %s', item.id);
      }
    }
  }

  function* syncDeprecateds() {
    if (missingDeprecateds.length === 0) {
      return;
    }
    that.log('  [%s] saving %d Deprecated fields', name, missingDeprecateds.length);

    const res = yield gather(missingDeprecateds.map(function(item) {
      return packageService.updateModulePackageFields(item.id, {
        deprecated: item.deprecated,
      });
    }));

    for (let i = 0; i < res.length; i++) {
      const item = missingDeprecateds[i];
      const r = res[i];
      if (r.error) {
        that.log('    save error, id: %s, error: %s', item.id, r.error.message);
      } else {
        that.log('    saved, id: %s, deprecated: %j', item.id, item.deprecated);
      }
    }
  }

  function* syncMissingUsers() {
    const missingUsers = [];
    const names = Object.keys(npmUsernames);
    if (names.length === 0) {
      return;
    }
    const rows = yield User.listByNames(names);
    const map = {};
    rows.forEach(function(r) {
      map[r.name] = r;
    });
    names.forEach(function(username) {
      const r = map[username];
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
    const res = yield gather(missingUsers.map(function(username) {
      return _saveNpmUser(username);
    }));

    for (let i = 0; i < res.length; i++) {
      const r = res[i];
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
    const res = yield gather(missingStarUsers.map(function(username) {
      return packageService.addStar(name, username);
    }));

    for (let i = 0; i < res.length; i++) {
      const r = res[i];
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
    const res = yield gather(diffNpmMaintainers.map(function(item) {
      return _saveMaintainer(name, item[0], item[1]);
    }));

    for (let i = 0; i < res.length; i++) {
      const r = res[i];
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

SyncModuleWorker.prototype._syncOneVersion = function* (versionIndex, sourcePackage) {
  const delay = Date.now() - sourcePackage.publish_time;
  logger.syncInfo('[sync_module_worker] delay: %s ms, publish_time: %s, start sync %s@%s',
    delay, utility.logDate(new Date(sourcePackage.publish_time)),
    sourcePackage.name, sourcePackage.version);
  const that = this;
  const username = this.username;
  const downurl = sourcePackage.dist.tarball;
  const filename = path.basename(downurl);
  const filepath = common.getTarballFilepath(filename);
  const ws = fs.createWriteStream(filepath);

  let options = {
    writeStream: ws,
    followRedirect: true,
    timeout: 600000, // 10 minutes download
    headers: {
      'user-agent': USER_AGENT,
    },
    gzip: true,
  };

  let dependencies = Object.keys(sourcePackage.dependencies || {});
  let devDependencies = [];
  if (this.syncDevDependencies) {
    devDependencies = Object.keys(sourcePackage.devDependencies || {});
  }

  that.log('    [%s:%d] syncing, delay: %s ms, version: %s, dist: %j, no deps: %s, ' +
   'publish on cnpm: %s, dependencies: %d, devDependencies: %d, syncDevDependencies: %s',
    sourcePackage.name, versionIndex,
    delay,
    sourcePackage.version,
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
    for (const dep of dependencies) {
      that.add(dep);
    }

    for (const dep of devDependencies) {
      that.add(dep);
    }
  }

  // add module dependence
  yield packageService.addDependencies(sourcePackage.name, dependencies);

  let shasum = crypto.createHash('sha1');
  let dataSize = 0;

  try {
    // get tarball
    logger.syncInfo('[sync_module_worker] downloading %j to %j', downurl, filepath);
    let r;
    try {
      r = yield urllib.request(downurl, options);
    } catch (err) {
      logger.syncInfo('[sync_module_worker] download %j to %j error: %s', downurl, filepath, err);
      throw err;
    }

    const statusCode = r.status || -1;
    // https://github.com/cnpm/cnpmjs.org/issues/325
    // if (statusCode === 404) {
    //   shasum = sourcePackage.dist.shasum;
    //   return yield *afterUpload({
    //     url: downurl
    //   });
    // }

    if (statusCode !== 200) {
      const err = new Error('Download ' + downurl + ' fail, status: ' + statusCode);
      err.name = 'DownloadTarballError';
      err.data = sourcePackage;
      logger.syncInfo('[sync_module_worker] %s', err.message);
      throw err;
    }

    // read and check
    const rs = fs.createReadStream(filepath);
    rs.on('data', function(data) {
      shasum.update(data);
      dataSize += data.length;
    });
    const end = thunkify.event(rs);
    yield end(); // after end event emit

    if (dataSize === 0) {
      const err = new Error('Download ' + downurl + ' file size is zero');
      err.name = 'DownloadTarballSizeZeroError';
      err.data = sourcePackage;
      logger.syncInfo('[sync_module_worker] %s', err.message);
      throw err;
    }

    // check shasum
    shasum = shasum.digest('hex');
    if (shasum !== sourcePackage.dist.shasum) {
      const err = new Error('Download ' + downurl + ' shasum:' + shasum +
        ' not match ' + sourcePackage.dist.shasum);
      err.name = 'DownloadTarballShasumError';
      err.data = sourcePackage;
      logger.syncInfo('[sync_module_worker] %s', err.message);
      throw err;
    }

    options = {
      key: common.getCDNKey(sourcePackage.name, filename),
      size: dataSize,
      shasum,
    };
    // upload to NFS
    logger.syncInfo('[sync_module_worker] uploading %j to nfs', options);
    let result;
    try {
      result = yield nfs.upload(filepath, options);
    } catch (err) {
      logger.syncInfo('[sync_module_worker] upload %j to nfs error: %s', err);
      throw err;
    }
    logger.syncInfo('[sync_module_worker] uploaded, saving %j to database', result);
    const uploadResult = yield afterUpload(result);
    logger.syncInfo('[sync_module_worker] sync %s@%s done!',
      sourcePackage.name, sourcePackage.version);
    return uploadResult;
  } finally {
    // remove tmp file whatever
    fs.unlink(filepath, utility.noop);
  }

  function* afterUpload(result) {
    // make sure sync module have the correct author info
    // only if can not get maintainers, use the username
    let author = username;
    if (Array.isArray(sourcePackage.maintainers)) {
      author = sourcePackage.maintainers[0].name || username;
    }

    const mod = {
      version: sourcePackage.version,
      name: sourcePackage.name,
      package: sourcePackage,
      author,
      publish_time: sourcePackage.publish_time,
    };

    // delete _publish_on_cnpm, because other cnpm maybe sync from current cnpm
    delete mod.package._publish_on_cnpm;
    if (that._publish) {
      // sync as publish
      mod.package._publish_on_cnpm = true;
    }

    const dist = {
      shasum,
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
    const r = yield packageService.saveModule(mod);

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
  const result = yield logService.create({ name, username });
  const worker = new SyncModuleWorker({
    logId: result.id,
    type: options.type,
    name,
    username,
    noDep: options.noDep,
    publish: options.publish,
    syncUpstreamFirst: options.syncUpstreamFirst,
  });
  worker.start();
  return result.id;
};
