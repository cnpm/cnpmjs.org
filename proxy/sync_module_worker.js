/**!
 * cnpmjs.org - proxy/sync_module_worker.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var co = require('co');
var gather = require('co-gather');
var defer = require('co-defer');
var thunkify = require('thunkify-wrap');
var debug = require('debug')('cnpmjs.org:proxy:sync_module_worker');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var urllib = require('co-urllib');
var utility = require('utility');
var ms = require('ms');
var urlparse = require('url').parse;
var nfs = require('../common/nfs');
var npm = require('./npm');
var common = require('../lib/common');
var Module = require('./module');
var ModuleDeps = require('./module_deps');
var Log = require('./module_log');
var config = require('../config');
var ModuleStar = require('./module_star');
var User = require('./user');
var ModuleUnpublished = require('./module_unpublished');

var USER_AGENT = 'sync.cnpmjs.org/' + config.version + ' ' + urllib.USER_AGENT;

function SyncModuleWorker(options) {
  EventEmitter.call(this);
  this._logId = options.logId;
  if (!Array.isArray(options.name)) {
    options.name = [options.name];
  }

  this.names = options.name || [];
  this.startName = this.names[0];

  this.username = options.username;
  this.concurrency = options.concurrency || 1;
  this._publish = options.publish; // _publish_on_cnpm

  this.syncingNames = {};
  this.nameMap = {};
  this.names.forEach(function (name) {
    this.nameMap[name] = true;
  }.bind(this));
  this.noDep = options.noDep; //do not sync dependences

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
  this.log('[done] Sync %s module finished, %d success, %d fail\nSuccess: [ %s ]\nFail: [ %s ]',
    this.startName,
    this.successes.length, this.fails.length,
    this.successes.join(', '), this.fails.join(', '));
  this.emit('end');
  this._finished = true;
};

SyncModuleWorker.prototype.log = function (format, arg1, arg2) {
  var str = '[' + utility.YYYYMMDDHHmmss() + '] ' + util.format.apply(util, arguments);
  debug(str);
  this._logId && Log.append(this._logId, str, utility.noop);
};

SyncModuleWorker.prototype.start = function () {
  this.log('user: %s, sync %s worker start, %d concurrency, nodeps: %s, publish: %s',
    this.username, this.names[0], this.concurrency, this.noDep, this._publish);
  var self = this;
  co(function *() {
    var arr = [];
    for (var i = 0; i < self.concurrency; i++) {
      arr.push(self.next(i));
    }
    yield arr;
  })();
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
  if (success) {
    this.pushSuccess(name);
  } else {
    this.pushFail(name);
  }
  delete this.syncingNames[name];
  var that = this;
  // relase the stack: https://github.com/cnpm/cnpmjs.org/issues/328
  defer.setImmediate(function *() {
    that.log('[c#%s] setImmediate after, %s done, start next...', concurrencyId, name);
    yield *that.next(concurrencyId);
  });
};

SyncModuleWorker.prototype.next = function *(concurrencyId) {
  var name = this.names.shift();
  if (!name) {
    return setImmediate(this.finish.bind(this));
  }

  var that = this;
  that.syncingNames[name] = true;
  var pkg = null;
  var status = 0;
  // get from npm
  try {
    var result = yield npm.request('/' + name);
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

  that.log('[c#%d] [%s] synced success, %d versions: %s',
    concurrencyId, name, versions.length, versions.join(', '));
  yield* that._doneOne(concurrencyId, name, true);
};

function *_listStarUsers(modName) {
  var users = yield ModuleStar.listUsers(modName);
  var userMap = {};
  users.forEach(function (user) {
    userMap[user] = true;
  });
  return userMap;
}

function *_addStar(modName, username) {
  yield ModuleStar.add(modName, username);
}

function *_saveNpmUser(username) {
  var user = yield *npm.getUser(username);
  if (!user) {
    return;
  }
  yield User.saveNpmUser(user);
}

SyncModuleWorker.prototype._unpublished = function* (name, unpublishedInfo) {
  var mods = yield Module.listByName(name);
  this.log('  [%s] start unpublished %d versions from local cnpm registry',
    name, mods.length);
  if (this._isLocalModule(mods)) {
    // publish on cnpm, dont sync this version package
    this.log('  [%s] publish on local cnpm registry, don\'t sync', name);
    return [];
  }

  var r = yield* ModuleUnpublished.add(name, unpublishedInfo);
  this.log('    [%s] save unpublished info: %j to row#%s',
    name, unpublishedInfo, r.insertId);
  if (mods.length === 0) {
    return;
  }
  yield [Module.removeByName(name), Module.removeTags(name)];
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

  if (keys.length === 0) {
    return;
  }

  try {
    yield keys.map(function (key) {
      return nfs.remove(key);
    });
  } catch (err) {
    // ignore error here
    this.log('    [%s] delete nfs files: %j error: %s: %s',
      name, keys, err.name, err.message);
  }
  this.log('    [%s] delete nfs files: %j success', name, keys);
};

SyncModuleWorker.prototype._isLocalModule = function (mods) {
  for (var i = 0; i < mods.length; i++) {
    var r = mods[i];
    if (r.package && r.package._publish_on_cnpm) {
      return true;
    }
  }
  return false;
};

SyncModuleWorker.prototype._sync = function* (name, pkg) {
  var username = this.username;
  var that = this;

  var hasModules = false;
  var result = yield [
    Module.listByName(name),
    Module.listTags(name),
    _listStarUsers(name)
  ];
  var moduleRows = result[0];
  var tagRows = result[1];
  var existsStarUsers = result[2];

  if (that._isLocalModule(moduleRows)) {
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

    if (r.version === 'next') {
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

  // find out all user names
  for (var v in pkg.versions) {
    var p = pkg.versions[v];

    var maintainers = p.maintainers || [];
    if (maintainers && !Array.isArray(maintainers)) {
      // http://r.cnpmjs.org/jasmine-node
      // TODO: "maintainers": "Martin H膫陇ger <martin.haeger@gmail.com>",
      maintainers = [maintainers];
    }

    maintainers.forEach(function (m) {
      if (m.name) {
        npmUsernames[m.name.toLowerCase()] = 1;
      }
    });
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
  if (remoteVersionNames.length === 0) {
    that.log('  [%s] no times and no versions, hasModules: %s', name, hasModules);
    if (!hasModules) {
      // save a next module
      var maintainer = pkg.maintainers && pkg.maintainers[0];
      if (maintainer && maintainer.name) {
        maintainer = maintainer.name;
      }
      if (!maintainer) {
        maintainer = '-';
      }
      var nextMod = {
        name: name,
        version: 'next',
        author: maintainer,
        package: {
          name: name,
          version: 'next',
          description: pkg.description || '',
          readme: pkg.readme || '',
          maintainers: pkg.maintainers || {
            name: maintainer
          },
        },
      };
      try {
        var result = yield Module.add(nextMod);
        that.log('  [%s] save next module, %j', name, result);
      } catch (err) {
        that.log('  [%s] save next module error %s', err.message);
      }
    }
  }

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
    var sourceAuthor = version.maintainers && version.maintainers[0] &&
      version.maintainers[0].name || exists.author;

    if (exists.package && exists.package.dist.shasum === version.dist.shasum &&
      exists.author === sourceAuthor) {
      // * author make sure equal
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
      var result = yield that._syncOneVersion(index, syncModule);
      syncedVersionNames.push(syncModule.version);
    } catch (err) {
      that.log('    [%s:%d] sync error, version: %s, %s: %s',
        syncModule.name, index, syncModule.version, err.name, err.message);
    }
  }


  if (deletedVersionNames.length === 0) {
    that.log('  [%s] no versions need to deleted', name);
  } else {
    that.log('  [%s] %d versions: %j need to deleted',
      name, deletedVersionNames.length, deletedVersionNames);

    try {
      yield Module.removeByNameAndVersions(name, deletedVersionNames);
    } catch (err) {
      that.log('    [%s] delete error, %s: %s', name, err.name, err.message);
    }
  }

  // sync missing descriptions
  function *syncDes() {
    if (missingDescriptions.length === 0) {
      return;
    }
    that.log('  [%s] saving %d descriptions', name, missingDescriptions.length);
    var res = yield gather(missingDescriptions.map(function (item) {
      return Module.updateDescription(item.id, item.description);
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
  function *syncTag() {
    if (deletedTags.length > 0) {
      yield* Module.removeTagsByNames(name, deletedTags);
      that.log('  [%s] deleted %d tags: %j',
        name, deletedTags.length, deletedTags);
    }

    if (missingTags.length === 0) {
      return;
    }
    that.log('  [%s] adding %d tags', name, missingTags.length);
    // sync tags

    var res = yield gather(missingTags.map(function (item) {
      return Module.addTag(name, item[0], item[1]);
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
  function *syncReadme() {
    if (missingReadmes.length === 0) {
      return;
    }
    that.log('  [%s] saving %d readmes', name, missingReadmes.length);

    var res = yield gather(missingReadmes.map(function (item) {
      return Module.updateReadme(item.id, item.readme);
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

  function *syncMissingUsers() {
    var missingUsers = [];
    var names = Object.keys(npmUsernames);
    if (names.length === 0) {
      return;
    }
    var rows = yield *User.listByNames(names);
    var map = {};
    rows.forEach(function (r) {
      map[r.name] = r;
    });
    names.forEach(function (username) {
      var r = map[username];
      if (!r || !r.json) {
        missingUsers.push(username);
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
  function *syncMissingStarUsers() {
    if (missingStarUsers.length === 0) {
      return;
    }

    that.log('  [%s] saving %d star users', name, missingStarUsers.length);
    var res = yield gather(missingStarUsers.map(function (username) {
      return _addStar(name, username);
    }));

    for (var i = 0; i < res.length; i++) {
      var r = res[i];
      if (r.error) {
        that.log('    add star user error, %s', r.error.message);
      }
    }
  }

  yield [syncDes(), syncTag(), syncReadme(), syncMissingStarUsers(), syncMissingUsers()];
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
    }
  };

  var dependencies = Object.keys(sourcePackage.dependencies || {});
  var devDependencies = Object.keys(sourcePackage.devDependencies || {});

  that.log('    [%s:%d] syncing, version: %s, dist: %j, no deps: %s, ' +
   'publish on cnpm: %s, dependencies: %d, devDependencies: %d',
    sourcePackage.name, versionIndex, sourcePackage.version,
    sourcePackage.dist, that.noDep, that._publish,
    dependencies.length, devDependencies.length);

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
  try {
    yield dependencies.map(function (depName) {
      return ModuleDeps.add(depName, sourcePackage.name);
    });
  } catch (err) {
    // ignore
  }

  var shasum = crypto.createHash('sha1');
  var dataSize = 0;

  try {
    // get tarball
    var r = yield *urllib.request(downurl, options);
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
    var r = yield Module.add(mod);

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
  var pkg = yield npm.get(name);
  if (!pkg || !pkg._rev) {
    return {
      ok: false,
      pkg: pkg,
      statusCode: 404
    };
  }
  var result = yield Log.create({name: name, username: username});
  var worker = new SyncModuleWorker({
    logId: result.id,
    name: name,
    username: username,
    noDep: options.noDep,
    publish: options.publish,
  });
  worker.start();
  return {
    ok: true,
    logId: result.id,
    pkg: pkg
  };
};
