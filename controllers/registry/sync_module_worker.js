/**!
 * cnpmjs.org - controllers/registry/sync_module_worker.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:controllers:registry:sync_module_worker');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var eventproxy = require('eventproxy');
var urllib = require('urllib');
var utility = require('utility');
var nfs = require('../../common/nfs');
var npm = require('../../proxy/npm');
var common = require('./common');
var Module = require('../../proxy/module');
var Log = require('../../proxy/module_log');

function SyncModuleWorker(options) {
  EventEmitter.call(this);
  this._logId = options.logId;
  this.startName = options.name;
  this.names = [options.name];
  this.username = options.username;
  this.nameMap = {};
  this.successes = [];
  this.fails = [];
}

util.inherits(SyncModuleWorker, EventEmitter);

module.exports = SyncModuleWorker;

SyncModuleWorker.prototype.finish = function () {
  this.log('[done] Sync %s module finished, %d success, %d fail\nSuccess: [ %s ]\nFail: [ %s ]',
    this.startName,
    this.successes.length, this.fails.length,
    this.successes.join(', '), this.fails.join(', '));
  this.emit('end');
};

SyncModuleWorker.prototype.log = function (format, arg1, arg2) {
  var str = '[' + utility.YYYYMMDDHHmmss() + '] ' + util.format.apply(util, arguments);
  debug(str);
  Log.append(this._logId, str, utility.noop);
};

SyncModuleWorker.prototype.start = function () {
  this.log('user: %s, sync %s worker start.', this.username, this.names[0]);
  this.next();
};

SyncModuleWorker.prototype.add = function (name) {
  if (this.nameMap[name]) {
    return;
  }
  this.nameMap[name] = true;
  this.names.push(name);
  this.log('    add dependencies: %s', name);
};

SyncModuleWorker.prototype.next = function () {
  var name = this.names.shift();
  if (!name) {
    return this.finish();
  }

  var that = this;
  npm.get(name, function (err, pkg, response) {
    if (!err && !pkg) {
      err = new Error('Module ' + name + ' not exists, http status ' + response.statusCode);
      err.name = 'NpmModuleNotExsitsError';
    }
    if (err) {
      that.fails.push(name);
      that.log('[error] [%s] get package error: %s', name, err.stack);
      return that.next();
    }

    that.log('Start syncing %s', pkg.name);
    that._sync(pkg, function (err, versions) {
      if (err) {
        that.fails.push(pkg.name);
        that.log('[error] [%s] sync error: %s', name, err.stack);
        return that.next();
      }
      that.log('[%s] synced success, %d versions: %s',
        name, versions.length, versions.join(', '));
      that.successes.push(name);
      that.next();
    });
  });
};

SyncModuleWorker.prototype._sync = function (pkg, callback) {
  var username = this.name;
  var name = pkg.name;
  var that = this;
  var ep = eventproxy.create();
  ep.fail(callback);

  Module.listByName(name, ep.done(function (rows) {
    var map = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.version === 'next') {
        continue;
      }
      if (!map.latest) {
        map.latest = r;
      }
      map[r.version] = r;
    }
    ep.emit('existsMap', map);
  }));

  Module.listTags(name, ep.done(function (rows) {
    var tags = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      tags[r.tag] = r.version;
    }
    ep.emit('existsTags', tags);
  }));

  var missingVersions = [];
  var missingTags = [];
  ep.all('existsMap', 'existsTags', function (map, tags) {
    var times = pkg.time || {};
    var versions = [];
    for (var v in times) {
      var exists = map[v];
      var version = pkg.versions[v];
      if (!version || !version.dist) {
        continue;
      }
      if (exists && exists.package.dist.shasum === version.dist.shasum) {
        continue;
      }
      version.gmt_modified = Date.parse(times[v]);
      versions.push(version);
    }

    var sourceTags = pkg['dist-tags'] || {};
    for (var t in sourceTags) {
      var sourceTagVersion = sourceTags[t];
      if (sourceTagVersion && tags[t] !== sourceTagVersion) {
        missingTags.push([t, sourceTagVersion]);
      }
    }

    if (versions.length === 0) {
      that.log('  [%s] all versions are exists', pkg.name);
      return ep.emit('syncDone');
    }

    versions.sort(function (a, b) {
      return a.gmt_modified - b.gmt_modified;
    });
    missingVersions = versions;
    that.log('  [%s] %d versions', pkg.name, versions.length);
    ep.emit('syncModule', missingVersions.shift());
  });

  var versionNames = [];
  ep.on('syncModule', function (syncModule) {
    versionNames.push(syncModule.version);
    that._syncOneVersion(versionNames.length, syncModule, ep.done(function (result) {
      var nextVersion = missingVersions.shift();
      if (!nextVersion) {
        return ep.emit('syncDone', result);
      }
      ep.emit('syncModule', nextVersion);
    }));
  });

  ep.on('syncDone', function () {
    if (missingTags.length === 0) {
      return ep.emit('done');
    }

    that.log('  [%s] adding %d tags', pkg.name, missingTags.length);
    // sync tags
    missingTags.forEach(function (item) {
      Module.addTag(pkg.name, item[0], item[1], ep.done(function (result) {
        that.log('    added tag %s:%s', item[0], item[1]);
        ep.emit('addTag');
      }));
    });

    ep.after('addTag', missingTags.length, function () {
      ep.emit('done');
    });
  });

  ep.on('done', function () {
    // TODO: set latest version
    callback(null, versionNames);
  });
};

SyncModuleWorker.prototype._syncOneVersion = function (versionIndex, sourcePackage, callback) {
  var that = this;
  var username = this.username;
  var downurl = sourcePackage.dist.tarball;
  var filename = path.basename(downurl);
  var filepath = common.getTarballFilepath(filename);
  var ws = fs.createWriteStream(filepath);
  var options = {
    writeStream: ws,
  };
  var ep = eventproxy.create();
  ep.fail(function (err) {
    // remove tmp file whatever
    fs.unlink(filepath, utility.noop);
    callback(err);
  });

  that.log('    [%s:%d] syncing, version: %s, dist: %j',
    sourcePackage.name, versionIndex, sourcePackage.version, sourcePackage.dist);

  for (var k in sourcePackage.dependencies) {
    that.add(k);
  }

  for (var k in sourcePackage.devDependencies) {
    that.add(k);
  }

  var shasum = crypto.createHash('sha1');
  var dataSize = 0;
  urllib.request(downurl, options, ep.done(function (_, response) {
    var statusCode = response && response.statusCode || -1;
    if (statusCode !== 200) {
      var err = new Error('Download ' + downurl + ' fail, status: ' + statusCode);
      err.name = 'DownloadTarballError';
      err.data = sourcePackage;
      return ep.emit('error', err);
    }

    var rs = fs.createReadStream(filepath);
    rs.once('error', function (err) {
      ep.emit('error', err);
    });
    rs.on('data', function (data) {
      shasum.update(data);
      dataSize += data.length;
    });
    rs.on('end', function () {
      shasum = shasum.digest('hex');
      if (shasum !== sourcePackage.dist.shasum) {
        var err = new Error('Download ' + downurl + ' shasum:' + shasum + ' not match ' + sourcePackage.dist.shasum);
        err.name = 'DownloadTarballShasumError';
        err.data = sourcePackage;
        return ep.emit('error', err);
      }

      var key = common.getCDNKey(sourcePackage.name, filename);
      nfs.upload(filepath, {key: key, size: dataSize}, ep.done('uploadResult'));
    });
  }));

  ep.on('uploadResult', function (result) {
    // remove tmp file whatever
    fs.unlink(filepath, utility.noop);
    var mod = {
      version: sourcePackage.version,
      name: sourcePackage.name,
      package: sourcePackage,
      author: username,
    };
    var dist = {
      tarball: result.url,
      shasum: shasum,
      size: dataSize
    };
    mod.package.dist = dist;

    that.log('    [%s:%s] done, version: %s, size: %d',
      sourcePackage.name, versionIndex, mod.version, dataSize);
    Module.add(mod, ep.done(function (result) {
      callback(null, result);
    }));
  });
};
