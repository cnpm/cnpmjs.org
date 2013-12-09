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

var debug = require('debug')('cnpm:controllers:registry:sync_module_worker');
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
  this.names = [options.name];
  this.username = options.username;
  this.nameMap = {};
  this.successes = [];
  this.fails = [];
}

util.inherits(SyncModuleWorker, EventEmitter);

module.exports = SyncModuleWorker;

SyncModuleWorker.prototype.finish = function () {
  this.log('Finished, %d success, %d fail\nSuccess: [ %s ]\nFail: [ %s ]',
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
      map[r.version] = r;
    }
    ep.emit('existsMap', map);
  }));

  var missingVersions = [];
  ep.on('existsMap', function (map) {
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

    if (versions.length === 0) {
      that.log('  [%s] all versions are exists', pkg.name);
      return ep.emit('done');
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
        return ep.emit('done', result);
      }
      ep.emit('syncModule', nextVersion);
    }));
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
  ep.fail(callback);

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
      fs.unlink(filepath, utility.noop);
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
        fs.unlink(filepath, utility.noop);
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
