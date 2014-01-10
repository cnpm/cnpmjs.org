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

var debug = require('debug')('cnpmjs.org:proxy:sync_module_worker');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var eventproxy = require('eventproxy');
var urllib = require('urllib');
var utility = require('utility');
var nfs = require('../common/nfs');
var npm = require('./npm');
var common = require('../lib/common');
var Module = require('./module');
var Log = require('./module_log');
var ms = require('ms');

function SyncModuleWorker(options) {
  EventEmitter.call(this);
  this._logId = options.logId;
  this.startName = options.name;
  if (!Array.isArray(options.name)) {
    options.name = [options.name];
  }

  this.names = options.name;
  // for (var i = 0; i < this.names.length; i++) {
  //   // ensure package name is lower case
  //   this.names[i] = this.names[i].toLowerCase();
  // }

  this.username = options.username;
  this.concurrency = options.concurrency || 1;
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
  this.log('user: %s, sync %s worker start, %d concurrency.', this.username, this.names[0], this.concurrency);
  for (var i = 0; i < this.concurrency; i++) {
    this.next(i);
  }
};

SyncModuleWorker.prototype.add = function (name) {
  if (this.nameMap[name]) {
    return;
  }
  this.nameMap[name] = true;
  this.names.push(name);
  this.log('    add dependencies: %s', name);
};

SyncModuleWorker.prototype.next = function (concurrencyId) {
  var name = this.names.shift();
  if (!name) {
    return process.nextTick(this.finish.bind(this));
  }

  var that = this;
  that.syncingNames[name] = true;
  npm.get(name, function (err, pkg, response) {
    var statusCode = response && response.statusCode || -1;
    if (!err && !pkg) {
      err = new Error('Module ' + name + ' not exists, http status ' + statusCode);
      err.name = 'NpmModuleNotExsitsError';
    }
    if (err) {
      if (statusCode === 404) {
        that.successes.push(name);
      } else {
        that.fails.push(name);
      }
      that.log('[error] [%s] get package error: %s', name, err.stack);
      delete that.syncingNames[name];
      return that.next(concurrencyId);
    }

    that.log('[c#%d] [%s] start...', concurrencyId, pkg.name);
    that._sync(pkg, function (err, versions) {
      delete that.syncingNames[name];
      if (err) {
        that.fails.push(pkg.name);
        that.log('[error] [%s] sync error: %s', name, err.stack);
        return that.next(concurrencyId);
      }
      that.log('[%s] synced success, %d versions: %s',
        name, versions.length, versions.join(', '));
      that.successes.push(name);
      that.emit('success', name);
      that.next(concurrencyId);
    });
  });
};

SyncModuleWorker.prototype._sync = function (pkg, callback) {
  var username = this.name;
  var name = pkg.name;
  var that = this;
  var ep = eventproxy.create();
  ep.fail(callback);

  var hasModules = false;
  Module.listByName(name, ep.done(function (rows) {
    hasModules = rows.length > 0;
    var map = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r.package || !r.package.dist) {
        // package json parse error
        continue;
      }

      if (r.package && r.package._publish_on_cnpm) {
        // publish on cnpm, dont sync this version package
        that.log('  [%s] publish on local cnpm, don\'t sync.', pkg.name);
        ep.unbind();
        callback(null, []);
        return;
      }

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
      if (!r.module_id) {
        // no module_id, need to sync tags
        continue;
      }
      tags[r.tag] = r.version;
    }
    ep.emit('existsTags', tags);
  }));

  var missingVersions = [];
  var missingTags = [];
  var missingDescriptions = [];
  ep.all('existsMap', 'existsTags', function (map, tags) {
    var times = pkg.time || {};
    pkg.versions = pkg.versions || {};
    var versionNames = Object.keys(times);
    if (versionNames.length === 0) {
      versionNames = Object.keys(pkg.versions);
    }
    if (versionNames.length === 0) {
      that.log('  [%s] no times and no versions, hasModules: %s', pkg.name, hasModules);
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
          name: pkg.name,
          version: 'next',
          author: maintainer,
          package: {
            name: pkg.name,
            version: 'next',
            description: pkg.description || '',
            readme: pkg.readme || '',
            maintainers: pkg.maintainers || {
              name: maintainer
            },
          },
        };
        Module.add(nextMod, function (err, result) {
          that.log('  [%s] save next module, %j, error: %s', pkg.name, result, err);
        });
      }
    }
    var versions = [];
    for (var i = 0; i < versionNames.length; i++) {
      var v = versionNames[i];
      var exists = map[v] || {};
      var version = pkg.versions[v];
      if (!version || !version.dist) {
        continue;
      }

      var publish_time = times[v];
      version.publish_time = publish_time ? Date.parse(publish_time) : null;
      if (!version.maintainers || !version.maintainers[0]) {
        version.maintainers = pkg.maintainers;
      }
      var sourceAuthor = version.maintainers && version.maintainers[0] && version.maintainers[0].name || exists.author;

      if (exists.package && exists.package.dist.shasum === version.dist.shasum && exists.author === sourceAuthor) {
        // * author make sure equal
        // * shasum make sure equal
        if ((version.publish_time === exists.publish_time) || (!version.publish_time && exists.publish_time)) {
          debug('  [%s] %s publish_time equal: %s, %s',
            pkg.name, version.version, version.publish_time, exists.publish_time);
          // * publish_time make sure equal
          if (exists.description === null && version.description) {
            // * make sure description exists
            missingDescriptions.push({
              id: exists.id,
              description: version.description
            });
          }
          continue;
        }
      }
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
      return a.publish_time - b.publish_time;
    });
    missingVersions = versions;
    that.log('  [%s] %d versions', pkg.name, versions.length);
    ep.emit('syncModule', missingVersions.shift());
  });

  var versionNames = [];
  var syncIndex = 0;
  ep.on('syncModule', function (syncModule) {
    var index = syncIndex++;
    that._syncOneVersion(index, syncModule, function (err, result) {
      if (err) {
        that.log('    [%s:%d] error, version: %s, %s: %s',
          syncModule.name, index, syncModule.version, err.name, err.message);
      } else {
        versionNames.push(syncModule.version);
      }

      var nextVersion = missingVersions.shift();
      if (!nextVersion) {
        return ep.emit('syncDone', result);
      }
      ep.emit('syncModule', nextVersion);
    });
  });

  ep.on('syncDone', function () {
    if (missingDescriptions.length === 0) {
      return ep.emit('descriptionDone');
    }

    that.log('  [%s] saving %d descriptions', pkg.name, missingDescriptions.length);
    missingDescriptions.forEach(function (item) {
      Module.updateDescription(item.id, item.description, function (err, result) {
        if (err) {
          return that.log('    save error, %s: description %j, error: %s', item.id, item.description, err);
        }
        that.log('    saved, id: %s, description length: %d', item.id, item.description.length);
        ep.emit('saveDescription');
      });
    });

    ep.after('saveDescription', missingDescriptions.length, function () {
      ep.emit('descriptionDone');
    });
  });

  ep.on('syncDone', function () {
    if (missingTags.length === 0) {
      return ep.emit('tagDone');
    }

    that.log('  [%s] adding %d tags', pkg.name, missingTags.length);
    // sync tags
    missingTags.forEach(function (item) {
      Module.addTag(pkg.name, item[0], item[1], ep.done(function (result) {
        that.log('    added tag %s:%s, module_id: %s', item[0], item[1], result && result.module_id);
        ep.emit('addTag');
      }));
    });

    ep.after('addTag', missingTags.length, function () {
      ep.emit('tagDone');
    });
  });

  ep.all('tagDone', 'descriptionDone', function () {
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
    followRedirect: true,
    timeout: 600000, // 10 minutes download
  };
  var ep = eventproxy.create();
  ep.fail(function (err) {
    // remove tmp file whatever
    fs.unlink(filepath, utility.noop);
    callback(err);
  });

  that.log('    [%s:%d] syncing, version: %s, dist: %j',
    sourcePackage.name, versionIndex, sourcePackage.version, sourcePackage.dist);
  if (!that.noDep) {
    for (var k in sourcePackage.dependencies) {
      that.add(k);
    }

    for (var k in sourcePackage.devDependencies) {
      that.add(k);
    }
  }

  var shasum = crypto.createHash('sha1');
  var dataSize = 0;
  urllib.request(downurl, options, ep.done(function (_, response) {
    var statusCode = response && response.statusCode || -1;
    if (statusCode === 404) {
      // just copy source dist
      shasum = sourcePackage.dist.shasum;
      return ep.emit('uploadResult', {
        url: downurl
      });
    }

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
    Module.add(mod, ep.done(function (result) {
      that.log('    [%s:%s] done, insertId: %s, author: %s, version: %s, size: %d, publish_time: %j',
        sourcePackage.name, versionIndex,
        result.id,
        author, mod.version, dataSize, new Date(mod.publish_time));
      callback(null, result);
    }));
  });
};

SyncModuleWorker.sync = function (name, username, callback) {
  npm.get(name, function (err, pkg, response) {
    if (err) {
      return callback(err);
    }
    if (!pkg || !pkg._rev) {
      return callback(null, {
        ok: false,
        statusCode: response.statusCode,
        pkg: pkg
      });
    }
    Log.create({name: name, username: username}, function (err, result) {
      if (err) {
        return callback(err);
      }
      var worker = new SyncModuleWorker({
        logId: result.id,
        name: name,
        username: username,
      });
      worker.start();
      callback(null, {
        ok: true,
        logId: result.id,
        pkg: pkg
      });
    });
  });
};
