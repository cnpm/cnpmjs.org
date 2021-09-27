'use strict';

var debug = require('debug')('cnpmjs.org:sync_module_worker');
var co = require('co');
var gather = require('co-gather');
var defer = require('co-defer');
var thunkify = require('thunkify-wrap');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require('fs');
var mzFs = require('mz/fs');
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
var downloadTotalService = require('../services/download_total');
var hook = require('../services/hook');
var User = require('../models').User;
var os = require('os');
const cache = require('../common/cache');

var USER_AGENT = 'sync.cnpmjs.org/' + config.version +
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
  this._isEnd = false;
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
  this.syncFromBackupFile = options.syncFromBackupFile;

  this.syncingNames = {};
  this.nameMap = {};
  this.names.forEach(function (name) {
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
  this._saveLog();
  this._isEnd = true;
  this.emit('end');
  // make sure all event listeners release
  this.removeAllListeners();
};

var MAX_LEN = 10 * 1024;
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
    if (this._log.length >= MAX_LEN) {
      this._saveLog();
    }
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

  if (!logstr) {
    that._loging = false;
    return;
  }

  co(function* () {
    yield logService.append(that._logId, logstr);
  }).then(function () {
    that._loging = false;
    if (that._log) {
      that._saveLog();
    }
  }).catch(function (err) {
    that._loging = false;
    logger.error(err);
    // ignore the unsave log
    if (this._isEnd) {
      logger.error('[SyncModuleWorker] skip to save %s logstr: %s', that._logId, logstr);
    }
  });
};

SyncModuleWorker.prototype.start = function () {
  var that = this;
  that.log('user: %s, sync %s worker start, %d concurrency, nodeps: %s, publish: %s, syncUpstreamFirst: %s',
    that.username, that.names[0], that.concurrency, that.noDep, that._publish, that.syncUpstreamFirst);
  co(function* () {
    // sync upstream
    if (that.syncUpstreamFirst) {
      try {
        yield that.syncUpstream(that.startName);
        that._saveLog();
      } catch (err) {
        logger.error(err);
      }
    }

    if (that.type === 'user') {
      yield that.syncUser();
      that._saveLog();
      that._isEnd = true;
      return;
    }

    var arr = [];
    for (var i = 0; i < that.concurrency; i++) {
      arr.push(that.next(i));
    }
    yield arr;
    that._saveLog();
    yield that._saveBackupFiles();
  }).catch(function (err) {
    logger.error(err);
    that._saveLog();
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
  // clean cache
  if (cache) {
    const cacheKey = `list-${name}-v1`;
    cache.del(cacheKey).catch(err => {
      logger.error(err);
    });
  }

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
  var syncname = name;
  if (this.type === 'user') {
    syncname = this.type + ':' + syncname;
  }
  var url = config.sourceNpmRegistry + '/' + syncname + '/sync?sync_upstream=true';
  if (this.noDep) {
    url += '&nodeps=true';
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
    if (data.log) {
      data.log = data.log.replace('[done] Sync', '[Upstream done] Sync');
      this.log(data.log);
    }

    if (data.syncDone) {
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
  var name = this.names.shift();
  if (!name) {
    return setImmediate(this.finish.bind(this));
  }

  if (config.syncModel === 'none') {
    this.log('[c#%d] [%s] syncModel is none, ignore',
      concurrencyId, name);
    return this.finish();
  }

  // try to sync from official replicate when source npm registry is not cnpmjs.org
  const registry = config.sourceNpmRegistryIsCNpm ? config.sourceNpmRegistry : config.officialNpmReplicate;

  yield this.syncByName(concurrencyId, name, registry);
};

// TODO unimplement unpublish
SyncModuleWorker.prototype._syncByNameFromBackupFile = function* (concurrencyId, name, retryCount) {
  const that = this;
  this.syncingNames[name] = true;

  this.log('----------------- Syncing %s -------------------', name);

  // ignore private scoped package
  if (common.isPrivateScopedPackage(name)) {
    this.log('[c#%d] [%s] ignore sync private scoped %j package',
      concurrencyId, name, config.scopes);
    yield this._doneOne(concurrencyId, name, true);
    return;
  }

  // validate if unpublish
  const unpublished = yield validateUnpublish(name);
  if (unpublished) {
    this.log('[c#%d] [%s] package is unpublished skip sync',
      concurrencyId, name);
    yield this._doneOne(concurrencyId, name, true);
    return;
  }

  let packageJsons;
  let tags;
  try {
    const packageDir = common.getSyncPackageDir(name);
    const packageDirFiles = yield nfs.list(packageDir);
    const packageJsonFileNames = packageDirFiles.filter(fileName => common.isBackupPkgFile(fileName));

    const distTagDir = common.getSyncTagDir(name);
    const distTagDirFiles = yield nfs.list(distTagDir);
    const distTagFileNames = distTagDirFiles.filter(fileName => common.isBackupTagFile(fileName));

    const packageJsonRes = yield gather(packageJsonFileNames.map(function* (packageJsonFileName) {
      const version = common.getVersionFromFileName(packageJsonFileName);
      return yield readPackage(name, version);
    }), 5);
    packageJsons = packageJsonRes.map(({ isError, error, value}) => {
      if (isError) {
        error.message = '[sync] read package.json failed: ' + error.message;
        throw error;
      }
      return value;
    });

    packageJsons = packageJsons.sort((a, b) => {
      return a.publish_time - b.publish_time;
    });

    const tagRes = yield gather(distTagFileNames.map(function* (tagFileName) {
      const tag = common.getTagNameFromFileName(tagFileName);
      const version = yield readDistTag(name, tag);
      return {
        tag,
        version,
      };
    }));
    tags = tagRes.map(({ isError, error, value}) => {
      if (isError) {
        error.message = '[sync] read dist-tag failed: ' + error.message;
        throw error;
      }
      return value;
    });
  } catch (err) {
    if (retryCount < 3) {
      this.log('[c#%d] [%s] retry from oss after 3s, err: %s, retryCount: %s',
        concurrencyId, name, err.stack, retryCount);
      yield sleep(3000);
      yield this._syncByNameFromBackupFile(concurrencyId, name, retryCount + 1);
      return;
    }
    this.log('[c#%s] [error] [%s] sync error: %s', concurrencyId, name, err.stack);
    yield this._doneOne(concurrencyId, name, false);
    return;
  }

  const firstPkg = packageJsons[0];
  const lastPkg = packageJsons[packageJsons.length - 1];

  const times = packageJsons.reduce((times, packageJson) => {
    times[packageJson.version] = new Date(packageJson.publish_time);
    return times;
  }, {
    modified: new Date(lastPkg.publish_time),
    created: new Date(firstPkg.publish_time),
  });
  const distTags = tags.reduce((distTags, tag) => {
    distTags[tag.tag] = tag.version;
    return distTags;
  }, {});
  const versions = packageJsons.reduce((versions, packageJson) => {
    versions[packageJson.version] = packageJson;
    return versions;
  }, {});

  const pkg = {
    name,
    'dist-tags': distTags,
    versions: versions,
    time: times,

    description: lastPkg.description,
    maintainers: lastPkg.maintainers,
    author: lastPkg.author,
    repository: lastPkg.repository,
    readme: lastPkg.readme,
    readmeFilename: lastPkg.readmeFilename,
    homepage: lastPkg.homepage,
    bugs: lastPkg.bugs,
    license: lastPkg.license,
  };

  let syncVersions;
  try {
    syncVersions = yield this._sync(name, pkg);
  } catch (err) {
    this.log('[c#%s] [error] [%s] sync error: %s', concurrencyId, name, err.stack);
    yield this._doneOne(concurrencyId, name, false);
    return;
  }

  // has new version
  if (syncVersions.length > 0) {
    this.updates.push(name);
  }

  this.log('[c#%d] [%s] synced success, %d versions: %s',
    concurrencyId, name, syncVersions.length, syncVersions.join(', '));
  yield this._doneOne(concurrencyId, name, true);

  return syncVersions;

  function* validateUnpublish(name) {
    const filePath = common.getTarballFilepath(name, '', `unpublish-package.json`);
    const cdnKey = common.getUnpublishFileKey(name);
    let unpublishInfo;
    try {
      yield nfs.download(cdnKey, filePath);
      const packageJSONFile = yield mzFs.readFile(filePath, 'utf8');
      unpublishInfo = JSON.parse(packageJSONFile);
    } catch (_) {
      // ...
      return false;
    } finally {
      fs.unlink(filePath, utility.noop);
    }
    that.log('[c#%s] get unpublish info', concurrencyId, name);
    yield that._unpublished(name, unpublishInfo);
    return true;
  }

  function* readPackage(name, version) {
    const filePath = common.getTarballFilepath(name, version, `package-${version}.json`);
    const packageJsonKey = common.getPackageFileCDNKey(name, version);
    try {
      yield nfs.download(packageJsonKey, filePath);
      const packageJSONFile = yield mzFs.readFile(filePath, 'utf8');
      console.log('file: ', filePath, packageJSONFile);
      const packageJSON = JSON.parse(packageJSONFile);
      return packageJSON;
    } finally {
      fs.unlink(filePath, utility.noop);
    }
  }

  function* readDistTag(name, tag) {
    const filePath = common.getTarballFilepath(name, '', `tag-${tag}.json`);
    const packageJsonKey = common.getDistTagCDNKey(name, tag);
    try {
      yield nfs.download(packageJsonKey, filePath);
      const version = yield mzFs.readFile(filePath, 'utf8');
      return version;
    } finally {
      fs.unlink(filePath, utility.noop);
    }
  }
};

SyncModuleWorker.prototype.syncByName = function* (concurrencyId, name, registry, retryCount) {
  if (this.syncFromBackupFile) {
    yield this._syncByNameFromBackupFile(concurrencyId, name, retryCount);
    return;
  }

  retryCount = retryCount || 0;
  var that = this;
  that.syncingNames[name] = true;
  var pkg = null;
  var status = 0;

  this.log('----------------- Syncing %s -------------------', name);

  // ignore private scoped package
  if (common.isPrivateScopedPackage(name)) {
    this.log('[c#%d] [%s] ignore sync private scoped %j package',
      concurrencyId, name, config.scopes);
    yield this._doneOne(concurrencyId, name, true);
    return;
  }

  let realRegistry = registry;
  // get from npm, don't cache
  const packageUrl = '/' + name.replace('/', '%2f') + '?sync_timestamp=' + Date.now();
  try {
    var result = yield npmSerivce.request(packageUrl, { registry: registry });
    pkg = result.data;
    status = result.status;
    // read from officialNpmRegistry and use the latest modified package info
    if (registry === config.officialNpmReplicate) {
      try {
        const officialResult = yield npmSerivce.request(packageUrl, { registry: config.officialNpmRegistry });
        const officialPkg = officialResult.data;
        const officialStatus = officialResult.status;
        this.log('[c#%d] [%s] official registry(%j, %j), replicate(%j, %j), packageUrl: %s',
          concurrencyId, name,
          officialPkg['dist-tags'], officialPkg.time && officialPkg.time.modified,
          pkg['dist-tags'], pkg.time && pkg.time.modified, packageUrl);
        if (officialPkg.time) {
          if (!pkg.time || officialPkg.time.modified > pkg.time.modified) {
            this.log('[c#%d] [%s] use official registry\'s data instead of replicate, modified: %j < %j',
              concurrencyId, name, pkg.time && pkg.time.modified, officialPkg.time.modified);
            pkg = officialPkg;
            status = officialStatus;
            realRegistry = config.officialNpmRegistry;
          }
        }
      } catch (err) {
        that.log('[c#%s] [error] [%s] get package(%s%s) error: %s',
          concurrencyId, name, config.officialNpmReplicate, packageUrl, err);
      }
    }
  } catch (err) {
    // if 404
    if (!err.res || err.res.statusCode !== 404) {
      var errMessage = err.name + ': ' + err.message;
      that.log('[c#%s] [error] [%s] get package(%s%s) error: %s, status: %s, retryCount: %s',
        concurrencyId, name, registry, packageUrl, errMessage, status, retryCount);

      // retry from cnpmRegistry again, max 3 times
      if (registry === config.cnpmRegistry && retryCount < 3) {
        this.log('[c#%d] [%s] retry from %s after 3s, retryCount: %s',
          concurrencyId, name, registry, retryCount);
        yield sleep(3000);
        yield that.syncByName(concurrencyId, name, registry, retryCount + 1);
        return;
      }

      // replicate/cnpmRegistry request error, try to request from official registry
      if (registry !== config.officialNpmReplicate && registry !== config.cnpmRegistry) {
        // sync fail
        yield that._doneOne(concurrencyId, name, false);
        return;
      }

      // retry from officialNpmRegistry when officialNpmReplicate fail
      this.log('[c#%d] [%s] retry from %s, retryCount: %s',
        concurrencyId, name, config.officialNpmRegistry, retryCount);
      try {
        var result = yield npmSerivce.request(packageUrl, { registry: config.officialNpmRegistry });
        pkg = result.data;
        status = result.status;
        realRegistry = config.officialNpmRegistry;
      } catch (err) {
        var errMessage = err.name + ': ' + err.message;
        that.log('[c#%s] [error] [%s] get package(%s%s) error: %s, status: %s',
          concurrencyId, name, config.officialNpmRegistry, packageUrl, errMessage, status);
        // sync fail
        yield that._doneOne(concurrencyId, name, false);
        return;
      }
    }
  }

  if (status === 404 && pkg && pkg.reason && registry === config.officialNpmReplicate) {
    // unpublished package on replicate.npmjs.com
    // 404 { error: 'not_found', reason: 'deleted' }
    // try to read from registry.npmjs.com and get the whole unpublished info

    // https://replicate.npmjs.com/registry-url
    // {"error":"not_found","reason":"no_db_file"}
    // try to read from registry.npmjs.com and get no_db_file
    try {
      var result = yield npmSerivce.request(packageUrl, { registry: config.sourceNpmRegistry });
      pkg = result.data;
      status = result.status;
      realRegistry = config.sourceNpmRegistry;
    } catch (err) {
      // if 404
      if (!err.res || err.res.statusCode !== 404) {
        var errMessage = err.name + ': ' + err.message;
        that.log('[c#%s] [error] [%s] get package(%s%s) error: %s, status: %s',
          concurrencyId, name, config.sourceNpmRegistry, packageUrl, errMessage, status);
        yield that._doneOne(concurrencyId, name, false);
        return;
      }
    }
  }

  var unpublishedInfo = null;
  if (status === 404) {
    // check if it's unpublished
    // ignore too long package name, see https://github.com/cnpm/cnpmjs.org/issues/1066
    if (name.length < 80 && pkg && pkg.time && pkg.time.unpublished && pkg.time.unpublished.time) {
      unpublishedInfo = pkg.time.unpublished;
    } else {
      pkg = null;
    }
  } else {
    // unpublished package status become to 200
    if (name.length < 80 && pkg && pkg.time && pkg.time.unpublished && pkg.time.unpublished.time) {
      unpublishedInfo = pkg.time.unpublished;
    }
  }

  if (!pkg) {
    that.log('[c#%s] [error] [%s] get package(%s%s) error: package not exists, status: %s',
      concurrencyId, name, realRegistry, packageUrl, status);
    yield that._doneOne(concurrencyId, name, true);
    // return empty versions, try again on officialNpmRegistry
    return [];
  }

  that.log('[c#%d] [%s] package(%s%s) status: %s, dist-tags: %j, time.modified: %s, unpublished: %j, start...',
    concurrencyId, name, realRegistry, packageUrl, status,
    pkg['dist-tags'], pkg.time && pkg.time.modified,
    unpublishedInfo);

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

  var versions;
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

  return versions;
};

function* _listStarUsers(modName) {
  var users = yield packageService.listStarUserNames(modName);
  var userMap = {};
  users.forEach(function (user) {
    userMap[user] = true;
  });
  return userMap;
}

function* _saveNpmUser(username) {
  var user = yield npmSerivce.getUser(username);
  if (!user) {
    var existsUser = yield User.findByName(username);
    if (existsUser && existsUser.isNpmUser) {
      // delete it
      yield User.destroy({
        where: {
          name: username,
        }
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
  var mods = yield packageService.listModulesByName(name);
  this.log('  [%s] start unpublished %d versions from local cnpm registry',
    name, mods.length);
  if (common.isLocalModule(mods)) {
    // publish on cnpm, dont sync this version package
    this.log('  [%s] publish on local cnpm registry, don\'t sync', name);
    return [];
  }
  if (!config.syncDeletedVersions) {
    const downloadCount = yield downloadTotalService.getTotalByName(name);
    if (downloadCount >= 10000) {
      this.log('  [%s] total downloads %s >= 10000 and `config.syncDeletedVersions=false`, don\'t sync unpublished info', name, downloadCount);
      return [];
    }
    this.log('  [%s] total downloads %s < 10000 and `config.syncDeletedVersions=false`, still need to sync unpublished info', name, downloadCount);
  }

  var r = yield packageService.saveUnpublishedModule(name, unpublishedInfo);
  this.log('    [%s] save unpublished info: %j to row#%s',
    name, unpublishedInfo, r.id);
  if (mods.length) {
    yield [
      packageService.removeModulesByName(name),
      packageService.removeModuleTags(name),
    ];
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
  }

  if (config.syncBackupFiles) {
    yield this._saveUnpublishFile(name, unpublishedInfo);
  }
};

SyncModuleWorker.prototype._sync = function* (name, pkg) {
  var that = this;
  var hasModules = false;
  var result = yield [
    packageService.listModulesByName(name),
    packageService.listModuleTags(name),
    _listStarUsers(name),
    packageService.listPublicModuleMaintainers(name),
    packageService.listModuleAbbreviatedsByName(name),
  ];
  var moduleRows = result[0];
  var tagRows = result[1];
  var existsStarUsers = result[2];
  var existsNpmMaintainers = result[3];
  var existsModuleAbbreviateds = result[4];

  if (common.isLocalModule(moduleRows)) {
    // publish on cnpm, dont sync this version package
    that.log('  [%s] publish on local cnpm registry, don\'t sync', name);
    return [];
  }

  var missingModuleAbbreviateds = [];
  var existsModuleAbbreviatedsMap = {};
  for (var item of existsModuleAbbreviateds) {
    existsModuleAbbreviatedsMap[item.version] = item;
  }

  hasModules = moduleRows.length > 0;
  // localPackage
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

  var latestVersionPackageReadme = {
    version: pkg['dist-tags'].latest,
    readme: pkg.readme,
  };

  var tags = {};
  for (var i = 0; i < tagRows.length; i++) {
    var r = tagRows[i];
    if (!r.module_id) {
      // no module_id, need to sync tags
      continue;
    }
    tags[r.tag] = r.version;
  }

  // get package AbbreviatedMetadata
  var remoteAbbreviatedMetadatas = {};
  if (config.enableAbbreviatedMetadata) {
    // use ?cache=0 tell registry dont use cache result
    var packageUrl = '/' + name.replace('/', '%2f') + '?cache=0&sync_timestamp=' + Date.now();
    var result = yield npmSerivce.request(packageUrl, {
      dataType: 'text',
      registry: config.sourceNpmRegistry,
      headers: {
        Accept: 'application/vnd.npm.install-v1+json',
      },
    });
    if (result.status === 200) {
      var data;
      try {
        data = JSON.parse(result.data);
      } catch (err) {
        that.log('  [%s] get abbreviated meta error: %s, headers: %j, %j',
          name, err, result.headers, result.data);
      }
      if (data) {
        var versions = data && data.versions || {};
        for (var version in versions) {
          const item = versions[version];
          if (!item) {
            continue;
          }
          let hasMetaData = false;
          const metaData = {};
          // _hasShrinkwrap maybe undefined, dont change it
          if (typeof item._hasShrinkwrap === 'boolean') {
            hasMetaData = true;
            metaData._hasShrinkwrap = item._hasShrinkwrap;
          }

          const metaDataKeys = [ 'peerDependenciesMeta', 'os', 'cpu', 'workspaces' ];
          for (const key of metaDataKeys) {
            if (key in item) {
              hasMetaData = true;
              metaData[key] = item[key];
            }
          }
          if (hasMetaData) {
            remoteAbbreviatedMetadatas[version] = metaData;
          }
        }
      }
    }
  }

  // any properties changed versions
  var changedVersions = {};
  var missingVersions = [];
  var missingTags = [];
  var missingDescriptions = [];
  var missingReadmes = [];
  var missingStarUsers = [];
  var npmUsernames = {};
  var missingDeprecateds = [];
  // [[user, 'add or remove'], ...]
  var diffNpmMaintainers = [];

  // [
  //   { name, version, _hasShrinkwrap(boolean), peerDependenciesMeta(array), os(array), cpu(array), workspaces(array) }
  // ]
  var missingAbbreviatedMetadatas = [];
  // [
  //   { name, version, deprecated },
  // ]
  var missingDeprecatedsOnExistsModuleAbbreviated = [];

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
    // remove readme
    if (config.enableAbbreviatedMetadata) {
      version.readme = undefined;
    } else {
      // patch for readme
      if (!version.readme) {
        version.readme = pkg.readme;
      }
    }

    var publish_time = times[v];
    version.publish_time = publish_time ? Date.parse(publish_time) : null;
    if (!version.maintainers || !version.maintainers[0]) {
      version.maintainers = pkg.maintainers;
    }

    var abbreviatedMetadata = remoteAbbreviatedMetadatas[version.version];

    if (exists.package && exists.package.dist.shasum === version.dist.shasum) {
      var existsModuleAbbreviated = existsModuleAbbreviatedsMap[exists.package.version];
      if (!existsModuleAbbreviated) {
        missingModuleAbbreviateds.push(exists);
      } else {
        // sync missing deprecated on existsModuleAbbreviated
        if (exists.package.deprecated && exists.package.deprecated !== existsModuleAbbreviated.package.deprecated) {
          // add deprecated
          missingDeprecatedsOnExistsModuleAbbreviated.push({
            name,
            version: exists.package.version,
            deprecated: exists.package.deprecated,
          });
        } else if (existsModuleAbbreviated.package.deprecated && !exists.package.deprecated) {
          // remove deprecated
          missingDeprecatedsOnExistsModuleAbbreviated.push({
            name,
            version: exists.package.version,
            deprecated: undefined,
          });
        }
      }

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
          changedVersions[v] = 1;
        }

        if (config.enableAbbreviatedMetadata) {
          // remove readme
          if (exists.package.readme) {
            missingReadmes.push({
              id: exists.id,
              readme: undefined,
            });
          }
        } else {
          if (!exists.package.readme && version.readme) {
            // * make sure readme exists
            missingReadmes.push({
              id: exists.id,
              readme: version.readme,
            });
            changedVersions[v] = 1;
          }
        }

        if (version.deprecated && version.deprecated !== exists.package.deprecated) {
          // need to sync deprecated field
          missingDeprecateds.push({
            id: exists.id,
            deprecated: version.deprecated,
          });
          changedVersions[v] = 1;
        }
        if (exists.package.deprecated && !version.deprecated) {
          // remove deprecated info
          missingDeprecateds.push({
            id: exists.id,
            deprecated: undefined,
          });
          changedVersions[v] = 1;
        }

        // find missing abbreviatedMetadata
        if (abbreviatedMetadata) {
          for (var key in abbreviatedMetadata) {
            const value = abbreviatedMetadata[key];
            // boolean: _hasShrinkwrap
            if (key === '_hasShrinkwrap' && typeof value === 'boolean') {
              if (!(key in exists.package) || abbreviatedMetadata[key] !== exists.package[key]) {
                missingAbbreviatedMetadatas.push(Object.assign({
                  id: exists.id,
                  name: exists.package.name,
                  version: exists.package.version,
                }, abbreviatedMetadata));
                break;
              }
            } else if (Array.isArray(value)) {
              // array: os, cpu, peerDependenciesMeta, workspaces
              if (existsModuleAbbreviated && !(key in existsModuleAbbreviated.package)) {
                missingAbbreviatedMetadatas.push(Object.assign({
                  id: exists.id,
                  name: exists.package.name,
                  version: exists.package.version,
                }, abbreviatedMetadata));
                break;
              }
            }
          }
        }

        continue;
      }
    }

    // set abbreviatedMetadata to version package
    if (abbreviatedMetadata) {
      Object.assign(version, abbreviatedMetadata);
    }
    missingVersions.push(version);
    changedVersions[v] = 1;
  }

  // find out deleted versions
  var deletedVersionNames = [];
  for (var i = 0; i < localVersionNames.length; i++) {
    var v = localVersionNames[i];
    if (!remoteVersionNameMap[v]) {
      deletedVersionNames.push(v);
    }
  }
  // delete local abbreviatedMetadata data too
  for (var item of existsModuleAbbreviateds) {
    if (!remoteVersionNameMap[item.version] && deletedVersionNames.indexOf(item.version) === -1) {
      deletedVersionNames.push(item.version);
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
    // retry 3 times
    var tries = 3;
    while (true) {
      try {
        yield that._syncOneVersion(index, syncModule);
        syncedVersionNames.push(syncModule.version);
        break;
      } catch (err) {
        var delay = Date.now() - syncModule.publish_time;
        that.log('    [%s:%d] tries: %d, delay: %s ms, sync error, version: %s, %s: %s',
          syncModule.name, index, tries, delay, syncModule.version, err.name, err.stack);
        var maxDelay = 3600000;
        if (tries-- > 0 && delay < maxDelay) {
          that.log('    [%s:%d] retry after 30s', syncModule.name, index);
          yield sleep(30000);
        } else {
          break;
        }
      }
    }
  }

  if (deletedVersionNames.length === 0) {
    that.log('  [%s] no versions need to deleted', name);
  } else {
    if (config.syncDeletedVersions) {
      that.log('  [%s] %d versions: %j need to deleted, because config.syncDeletedVersions=true',
        name, deletedVersionNames.length, deletedVersionNames);
      try {
        yield packageService.removeModulesByNameAndVersions(name, deletedVersionNames);
      } catch (err) {
        that.log('    [%s] delete error, %s: %s', name, err.name, err.message);
      }
    } else {
      const downloadCount = yield downloadTotalService.getTotalByName(name);
      if (downloadCount >= 10000) {
        // find deleted in 24 hours versions
        var oneDay = 3600000 * 24;
        var now = Date.now();
        var deletedIn24HoursVersions = [];
        var oldVersions = [];
        for (var i = 0; i < deletedVersionNames.length; i++) {
          var v = deletedVersionNames[i];
          var exists = map[v];
          if (exists && now - exists.publish_time < oneDay) {
            deletedIn24HoursVersions.push(v);
          } else {
            oldVersions.push(v);
          }
        }
        if (deletedIn24HoursVersions.length > 0) {
          that.log('  [%s] %d versions: %j need to deleted, because they are deleted in 24 hours',
            name, deletedIn24HoursVersions.length, deletedIn24HoursVersions);
          try {
            yield packageService.removeModulesByNameAndVersions(name, deletedIn24HoursVersions);
          } catch (err) {
            that.log('    [%s] delete error, %s: %s', name, err.name, err.message);
          }
        }
        that.log('  [%s] %d versions: %j no need to delete, because `config.syncDeletedVersions=false`',
          name, oldVersions.length, oldVersions);
      } else {
        that.log('  [%s] %d versions: %j need to deleted, because downloads %s < 10000',
          name, deletedVersionNames.length, deletedVersionNames, downloadCount);
        try {
          yield packageService.removeModulesByNameAndVersions(name, deletedVersionNames);
        } catch (err) {
          that.log('    [%s] delete error, %s: %s', name, err.name, err.message);
        }
      }
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
      yield packageService.removeModuleTagsByNames(name, deletedTags);
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

  function* syncModuleAbbreviateds() {
    if (missingModuleAbbreviateds.length === 0) {
      return;
    }
    that.log('  [%s] saving %d missing moduleAbbreviateds', name, missingModuleAbbreviateds.length);

    var res = yield gather(missingModuleAbbreviateds.map(function (item) {
      return packageService.saveModuleAbbreviated(item);
    }));

    for (var i = 0; i < res.length; i++) {
      var item = missingModuleAbbreviateds[i];
      var r = res[i];
      if (r.error) {
        that.log('    save moduleAbbreviateds error, module: %s@%s, error: %s', item.name, item.version, r.error.message);
      } else {
        that.log('    saved moduleAbbreviateds, module: %s@%s', item.name, item.version);
      }
    }
  }

  function* syncAbbreviatedMetadatas() {
    if (missingAbbreviatedMetadatas.length === 0) {
      return;
    }
    that.log('  [%s] saving %d abbreviated meta datas', name, missingAbbreviatedMetadatas.length);

    var res = yield gather(missingAbbreviatedMetadatas.map(function (item) {
      return packageService.updateModuleAbbreviatedPackage(item);
    }));

    for (var i = 0; i < res.length; i++) {
      var item = missingAbbreviatedMetadatas[i];
      var r = res[i];
      if (r.error) {
        that.log('    save error, module_abbreviated: %s@%s, error: %s',
          item.name, item.version, r.error.stack);
      } else {
        that.log('    saved, module_abbreviated: %s@%s, %j', item.name, item.version, item);
      }
    }

    var res = yield gather(missingAbbreviatedMetadatas.map(function (item) {
      var fields = {};
      for (var key in item) {
        if (key === 'id' || key === 'name' || key === 'version') {
          continue;
        }
        fields[key] = item[key];
      }
      return packageService.updateModulePackageFields(item.id, fields);
    }));

    for (var i = 0; i < res.length; i++) {
      var item = missingAbbreviatedMetadatas[i];
      var r = res[i];
      if (r.error) {
        that.log('    save error, module id: %s, error: %s', item.id, r.error.stack);
      } else {
        that.log('    saved, module id: %s, %j', item.id, item);
      }
    }
  }

  function *syncDeprecatedsOnExistsModuleAbbreviated() {
    if (missingDeprecatedsOnExistsModuleAbbreviated.length === 0) {
      return;
    }
    that.log('  [%s] saving %d module abbreviated deprecated fields',
      name, missingDeprecatedsOnExistsModuleAbbreviated.length);

    var res = yield gather(missingDeprecatedsOnExistsModuleAbbreviated.map(function (item) {
      return packageService.updateModuleAbbreviatedPackage(item);
    }));

    for (var i = 0; i < res.length; i++) {
      var item = missingDeprecatedsOnExistsModuleAbbreviated[i];
      var r = res[i];
      if (r.error) {
        that.log('    save error, module abbreviated: %s@%s, error: %s', item.name, item.version, r.error.message);
      } else {
        that.log('    saved, module abbreviated: %s@%s, deprecated: %j', item.name, item.version, item.deprecated);
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
        that.log('    saved, id: %s, deprecated: %j', item.id, item.deprecated);
      }
    }
  }

  function* syncMissingUsers() {
    var missingUsers = [];
    var names = Object.keys(npmUsernames);
    if (names.length === 0) {
      return;
    }
    var rows = yield User.listByNames(names);
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

  if (latestVersionPackageReadme.version && latestVersionPackageReadme.readme) {
    var existsPackageReadme = yield packageService.getPackageReadme(name, true);
    if (!existsPackageReadme ||
        existsPackageReadme.version !== latestVersionPackageReadme.version ||
        existsPackageReadme.readme !== latestVersionPackageReadme.readme) {
      var r = yield packageService.savePackageReadme(name, latestVersionPackageReadme.readme, latestVersionPackageReadme.version);
      that.log('    save packageReadme: %s %s %s', r.id, r.name, r.version);
    }
  }

  yield syncDes();
  yield syncTag();
  yield syncReadme();
  yield syncDeprecateds();
  yield syncMissingStarUsers();
  yield syncMissingUsers();
  yield syncNpmPackageMaintainers();
  yield syncModuleAbbreviateds();
  yield syncAbbreviatedMetadatas();
  yield syncDeprecatedsOnExistsModuleAbbreviated();

  changedVersions = Object.keys(changedVersions);
  // hooks
  const envelope = {
    event: 'package:sync',
    name: name,
    type: 'package',
    version: null,
    hookOwner: null,
    payload: {
      changedVersions,
    },
    change: null,
  };
  hook.trigger(envelope);

  return syncedVersionNames;
};

SyncModuleWorker.prototype._syncOneVersion = function *(versionIndex, sourcePackage) {
  var delay = Date.now() - sourcePackage.publish_time;
  logger.syncInfo('[sync_module_worker] delay: %s ms, publish_time: %s, start sync %s@%s',
    delay, utility.logDate(new Date(sourcePackage.publish_time)),
    sourcePackage.name, sourcePackage.version);
  var that = this;
  var username = this.username;
  var downurl = sourcePackage.dist.tarball;
  var urlobj = urlparse(downurl);
  var filename = path.basename(urlobj.pathname);
  var filepath = common.getTarballFilepath(sourcePackage.name, sourcePackage.version, filename);
  var ws = fs.createWriteStream(filepath);

  var downloadOptions = {
    writeStream: ws,
    followRedirect: true,
    timeout: 600000, // 10 minutes download
    headers: {
      'user-agent': USER_AGENT,
    },
    gzip: true,
  };
  if (config.syncDownloadOptions) {
    Object.assign(downloadOptions, config.syncDownloadOptions);
  }

  var dependencies = Object.keys(sourcePackage.dependencies || {});
  var devDependencies = [];
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
    for (var i = 0; i < dependencies.length; i++) {
      that.add(dependencies[i]);
    }

    for (var i = 0; i < devDependencies.length; i++) {
      that.add(devDependencies[i]);
    }
  }

  // add module dependence
  yield packageService.addDependencies(sourcePackage.name, dependencies);

  var shasum = crypto.createHash('sha1');
  var dataSize = 0;

  try {
    // get tarball
    logger.syncInfo('[sync_module_worker] downloading %j to %j', downurl, filepath);
    var r;
    try {
      r = yield urllib.request(downurl, downloadOptions);
    } catch (err) {
      logger.syncInfo('[sync_module_worker] download %j to %j error: %s', downurl, filepath, err);
      throw err;
    }

    var statusCode = r.status || -1;
    // https://github.com/cnpm/cnpmjs.org/issues/325
    // if (statusCode === 404) {
    //   shasum = sourcePackage.dist.shasum;
    //   return yield afterUpload({
    //     url: downurl
    //   });
    // }

    if (statusCode !== 200) {
      var err = new Error('Download ' + downurl + ' fail, status: ' + statusCode);
      err.name = 'DownloadTarballError';
      err.data = sourcePackage;
      err.status = statusCode;
      logger.syncInfo('[sync_module_worker] %s', err.message);
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
      logger.syncInfo('[sync_module_worker] %s', err.message);
      throw err;
    }

    // check shasum
    shasum = shasum.digest('hex');
    if (shasum !== sourcePackage.dist.shasum) {
      var err = new Error('Download ' + downurl + ' shasum:' + shasum +
        ' not match ' + sourcePackage.dist.shasum);
      err.name = 'DownloadTarballShasumError';
      err.data = sourcePackage;
      logger.syncInfo('[sync_module_worker] %s', err.message);
      throw err;
    }

    var uploadOptions = {
      key: common.getCDNKey(sourcePackage.name, filename),
      size: dataSize,
      shasum: shasum
    };
    // upload to NFS
    logger.syncInfo('[sync_module_worker] uploading %j to nfs', uploadOptions);
    var result;
    try {
      result = yield nfs.upload(filepath, uploadOptions);
    } catch (err) {
      logger.syncInfo('[sync_module_worker] upload %j to nfs error: %s', err);
      throw err;
    }
    logger.syncInfo('[sync_module_worker] uploaded, saving %j to database', result);
    var r = yield afterUpload(result);
    logger.syncInfo('[sync_module_worker] sync %s@%s done!',
      sourcePackage.name, sourcePackage.version);
    return r;
  } finally {
    // remove tmp file whatever
    fs.unlink(filepath, utility.noop);
  }

  function *afterUpload(result) {
    //make sure sync module have the correct author info
    //only if can not get maintainers, use the username
    var author = username;
    if (Array.isArray(sourcePackage.maintainers) && sourcePackage.maintainers.length > 0) {
      author = sourcePackage.maintainers[0].name || username;
    } else if (sourcePackage._npmUser && sourcePackage._npmUser.name) {
      // try to use _npmUser instead
      author = sourcePackage._npmUser.name;
      sourcePackage.maintainers = [ sourcePackage._npmUser ];
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
    var r = yield packageService.saveModule(mod);
    var moduleAbbreviatedId = null;
    if (config.enableAbbreviatedMetadata) {
      var moduleAbbreviatedResult = yield packageService.saveModuleAbbreviated(mod);
      moduleAbbreviatedId = moduleAbbreviatedResult.id;
    }

    that.log('    [%s:%s] done, insertId: %s, author: %s, version: %s, '
      + 'size: %d, publish_time: %j, publish on cnpm: %s, '
      + 'moduleAbbreviatedId: %s',
      sourcePackage.name, versionIndex,
      r.id,
      author, mod.version, dataSize,
      new Date(mod.publish_time),
      that._publish,
      moduleAbbreviatedId);

    return r;
  }
};

SyncModuleWorker.prototype._saveBackupFiles = function *() {
  if (!config.syncBackupFiles) {
    return;
  }
  const pkgNames = Object.keys(this.nameMap);
  const that = this;
  yield gather(pkgNames.map(function* (pkgName) {
    yield that._saveBackupFile(pkgName);
  }), 5);
};

SyncModuleWorker.prototype._saveBackupFile = function *(pkgName) {
  const [ mods, tags ] = yield [
    packageService.listModulesByName(pkgName, [ 'version' ]),
    packageService.listModuleTags(pkgName),
  ];
  const that = this;
  yield gather(mods.map(function* (mod) {
    yield that._savePackageJsonBackup(pkgName, mod.version);
  }), 5);
  yield gather(tags.map(function* (tag) {
    yield that._saveDistTagBackup(pkgName, tag.tag, tag.version);
  }), 5);
  yield this._clearDeletedDistTags(pkgName, tags.map(t => t.tag));
};

SyncModuleWorker.prototype._saveUnpublishFile = function* (pkgName, pkg) {
  const cdnKey = common.getUnpublishFileKey(pkgName);
  const filePath = common.getTarballFilepath(pkgName, '', 'unpublish-package.json');
  this.log('[%s] start save unpublish-package.json', pkgName);
  const file = JSON.stringify(pkg);
  yield mzFs.writeFile(filePath, file);

  let shasum = crypto.createHash('sha1');
  shasum.update(file);
  shasum = shasum.digest('hex');

  yield nfs.upload(filePath, {
    key: cdnKey,
    size: file.length,
    shasum: shasum,
  });
  this.log('[%s:%s] save unpublish package.json backup success', pkgName);
};

SyncModuleWorker.prototype._savePackageJsonBackup = function *(pkgName, version) {
  const cdnKey = common.getPackageFileCDNKey(pkgName, version);
  const filePath = common.getTarballFilepath(pkgName, version, `package-${version}.json`);
  this.log('[%s:%s] start backup package.json', pkgName, version);
  // If package.json exists no need to sync
  try {
    yield nfs.download(cdnKey, filePath);
    fs.unlink(filePath, utility.noop);
    this.log('[%s:%s] package.json exits skip backup', pkgName, version);
    // Download success, no need to sync
    return;
  } catch (_) {
    // ...
  }
  // Version is from db, so mod can not be null
  const mod = yield packageService.showPackage(pkgName, version, {
    protocol: config.backupProtocol,
  });

  const file = JSON.stringify(mod.package);
  yield mzFs.writeFile(filePath, file);

  let shasum = crypto.createHash('sha1');
  shasum.update(file);
  shasum = shasum.digest('hex');

  yield nfs.upload(filePath, {
    key: cdnKey,
    size: file.length,
    shasum: shasum,
  });
  this.log('[%s:%s] package.json backup success', pkgName, version);
};

SyncModuleWorker.prototype._saveDistTagBackup = function *(pkgName, tag, version) {
  const cdnKey = common.getDistTagCDNKey(pkgName, tag);
  const filePath = common.getTarballFilepath(pkgName, '', `tag-${tag}.json`);
  this.log('[%s:%s] start backup dist-tag.json', pkgName, tag);
  let oldVersion;
  try {
    yield nfs.download(cdnKey, filePath);
    oldVersion = yield mzFs.readFile(filePath, 'utf8');
    fs.unlink(filePath, utility.noop);
  } catch (_) {
    // ...
  }
  this.log('[%s:%s] backup dist tag is %j current dist tag is %j', pkgName, tag, oldVersion, version);
  if (oldVersion === version) {
    this.log('[%s:%s] tag equal skip sync', pkgName, tag);
    return;
  }
  this.log('[%s:%s] tag not equal start sync', pkgName, tag);
  const file = version;
  yield mzFs.writeFile(filePath, file);

  let shasum = crypto.createHash('sha1');
  shasum.update(file);
  shasum = shasum.digest('hex');

  yield nfs.upload(filePath, {
    key: cdnKey,
    size: file.length,
    shasum: shasum,
  });
  this.log('[%s:%s] backup dist tag success', pkgName, tag);
};

SyncModuleWorker.prototype._clearDeletedDistTags = function *(pkgName, tagNames) {
  const syncDir = common.getSyncTagDir(pkgName);
  const backupDistTagFiless = yield nfs.list(syncDir);
  const currentTagNames = new Set(tagNames);
  const shouldDelTags = backupDistTagFiless.filter(tagFileName => {
    const tagName = common.getTagNameFromFileName(tagFileName);
    return (
      // File is an dist-tag file
      tagName
      // tag is deleted
      && !currentTagNames.has(tagName)
    );
  });
  this.log('[%s] current tags %j backup tags %j should delete tags %j', pkgName, tagNames, backupDistTagFiless, shouldDelTags);
  const that = this;
  yield shouldDelTags.map(function* (tagFileName) {
    const filePath = path.join(syncDir, tagFileName);
    that.log('[%s] delete tags %s', pkgName, filePath);
    yield nfs.remove(filePath);
  });
  this.log('[%s] delete tags success', pkgName);
};

SyncModuleWorker.sync = function* (name, username, options) {
  options = options || {};
  var result = yield logService.create({name: name, username: username});
  var worker = new SyncModuleWorker({
    logId: result.id,
    type: options.type,
    name: name,
    username: username,
    noDep: options.noDep,
    publish: options.publish,
    syncUpstreamFirst: options.syncUpstreamFirst,
    syncFromBackupFile: options.syncFromBackupFile,
  });
  worker.start();
  return result.id;
};
