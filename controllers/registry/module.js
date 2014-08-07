/**!
 * cnpmjs.org - controllers/registry/module.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:controllers:registry:module');
var path = require('path');
var fs = require('fs');
var util = require('util');
var crypto = require('crypto');
var utility = require('utility');
var coRead = require('co-read');
var coWrite = require('co-write');
var urlparse = require('url').parse;
var mime = require('mime');
var semver = require('semver');
var ms = require('ms');
var config = require('../../config');
var Module = require('../../proxy/module');
var Total = require('../../proxy/total');
var nfs = require('../../common/nfs');
var common = require('../../lib/common');
var DownloadTotal = require('../../proxy/download');
var SyncModuleWorker = require('../../proxy/sync_module_worker');
var logger = require('../../common/logger');
var ModuleDeps = require('../../proxy/module_deps');
var ModuleStar = require('../../proxy/module_star');
var ModuleUnpublished = require('../../proxy/module_unpublished');
var packageService = require('../../services/package');
var UserService = require('../../services/user');
var downloadAsReadStream = require('../utils').downloadAsReadStream;
var deprecateVersions = require('./deprecate');

/**
 * show all version of a module
 * GET /:name
 */
exports.show = function* (next) {
  var orginalName = this.params.name || this.params[0];
  var name = orginalName;
  var rs = yield [
    Module.getLastModified(name),
    Module.listTags(name)
  ];
  var modifiedTime = rs[0];
  var tags = rs[1];
  var adaptDefaultScope = false;

  if (tags.length === 0) {
    var adaptName = yield* Module.getAdaptName(name);
    if (adaptName) {
      adaptDefaultScope = true;
      // remove default scope name and retry
      name = adaptName;
      rs = yield [
        Module.getLastModified(name),
        Module.listTags(name),
      ];
      modifiedTime = rs[0];
      tags = rs[1];
    }
  }

  debug('show %s(%s), last modified: %s, tags: %j', name, orginalName, modifiedTime, tags);
  if (modifiedTime) {
    // find out the latest modfied time
    // because update tags only modfied tag, wont change module gmt_modified
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      if (tag.gmt_modified > modifiedTime) {
        modifiedTime = tag.gmt_modified;
      }
    }

    // use modifiedTime as etag
    this.set('ETag', '"' + modifiedTime.getTime() + '"');

    // must set status first
    this.status = 200;
    if (this.fresh) {
      debug('%s not change at %s, 304 return', name, modifiedTime);
      this.status = 304;
      return;
    }
  }

  var r = yield [
    Module.listByName(name),
    ModuleStar.listUsers(name),
    packageService.listMaintainers(name),
  ];
  var rows = r[0];
  var users = r[1];
  var maintainers = r[2];

  debug('show %s got %d rows, %d tags, %d star users, maintainers: %j',
    name, rows.length, tags.length, users.length, maintainers);

  var userMap = {};
  for (var i = 0; i < users.length; i++) {
    userMap[users[i]] = true;
  }
  users = userMap;

  if (rows.length === 0) {
    // check if unpublished
    var unpublishedInfo = yield* ModuleUnpublished.get(name);
    debug('show unpublished %j', unpublishedInfo);
    if (unpublishedInfo) {
      this.status = 404;
      this.body = {
        _id: orginalName,
        name: orginalName,
        time: {
          modified: unpublishedInfo.package.time,
          unpublished: unpublishedInfo.package,
        },
        _attachments: {}
      };
      return;
    }
  }

  // if module not exist in this registry,
  // sync the module backend and return package info from official registry
  if (rows.length === 0) {
    if (!this.allowSync || adaptDefaultScope) {
      this.status = 404;
      this.body = {
        error: 'not_found',
        reason: 'document not found'
      };
      return;
    }
    var result = yield* SyncModuleWorker.sync(name, 'sync-by-install');
    this.body = result.pkg;
    this.status = result.ok ? 200 : (result.statusCode || 500);
    return;
  }

  var latestMod = null;
  var readme = null;
  // set tags
  var distTags = {};
  for (var i = 0; i < tags.length; i++) {
    var t = tags[i];
    distTags[t.tag] = t.version;
  }

  // set versions and times
  var versions = {};
  var times = {};
  var attachments = {};
  var createdTime = null;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var pkg = row.package;
    common.setDownloadURL(pkg, this);
    pkg._cnpm_publish_time = row.publish_time;
    versions[pkg.version] = pkg;

    var t = times[pkg.version] = row.publish_time ? new Date(row.publish_time) : row.gmt_modified;
    if ((!distTags.latest && !latestMod) || distTags.latest === pkg.version) {
      latestMod = row;
      readme = pkg.readme;
    }

    delete pkg.readme;
    if (maintainers.length > 0) {
      pkg.maintainers = maintainers;
    }

    if (!createdTime || t < createdTime) {
      createdTime = t;
    }

    if (adaptDefaultScope) {
      // change to orginal name for default scope was removed above
      pkg.name = orginalName;
      pkg._id = orginalName + '@' + pkg.version;
    }
  }

  if (modifiedTime && createdTime) {
    var ts = {
      modified: modifiedTime,
      created: createdTime,
    };
    for (var t in times) {
      ts[t] = times[t];
    }
    times = ts;
  }

  if (!latestMod) {
    latestMod = rows[0];
  }

  var rev = String(latestMod.id);
  var pkg = latestMod.package;

  if (tags.length === 0) {
    // some sync error reason, will cause tags missing
    // set latest tag at least
    distTags.latest = pkg.version;
  }

  var info = {
    _id: orginalName,
    _rev: rev,
    name: orginalName,
    description: pkg.description,
    "dist-tags": distTags,
    maintainers: pkg.maintainers,
    time: times,
    users: users,
    author: pkg.author,
    repository: pkg.repository,
    versions: versions,
    readme: readme,
    _attachments: attachments,
  };

  info.readmeFilename = pkg.readmeFilename;
  info.homepage = pkg.homepage;
  info.bugs = pkg.bugs;
  info.license = pkg.license;

  debug('show module %s: %s, latest: %s', orginalName, rev, latestMod.version);
  this.body = info;
};

/**
 * get the special version or tag of a module
 *
 * GET /:name/:version
 * GET /:name/:tag
 */
exports.get = function* (next) {
  var name = this.params.name || this.params[0];
  var tag = this.params.version || this.params[1];
  var version = semver.valid(tag);
  var method = version ? 'get' : 'getByTag';
  var queryLabel = version ? version : tag;
  var orginalName = name;
  var adaptDefaultScope = false;
  debug('%s %s with %j', method, name, this.params);

  var mod = yield Module[method](name, queryLabel);
  if (!mod) {
    var adaptName = yield* Module.getAdaptName(name);
    if (adaptName) {
      name = adaptName;
      mod = yield Module[method](name, queryLabel);
      adaptDefaultScope = true;
    }
  }

  if (mod) {
    common.setDownloadURL(mod.package, this);
    mod.package._cnpm_publish_time = mod.publish_time;
    var maintainers = yield* packageService.listMaintainers(name);
    if (maintainers.length > 0) {
      mod.package.maintainers = maintainers;
    }
    if (adaptDefaultScope) {
      mod.package.name = orginalName;
      mod.package._id = orginalName + '@' + mod.package.version;
    }
    this.body = mod.package;
    return;
  }
  // if not fond, sync from source registry
  if (!this.allowSync || adaptDefaultScope) {
    this.status = 404;
    this.body = {
      error: 'not exist',
      reason: 'version not found: ' + version
    };
    return;
  }

  var result = yield SyncModuleWorker.sync(name, 'sync-by-install');
  var pkg = result.pkg && result.pkg.versions[version];
  if (!pkg) {
    this.status = 404;
    this.body = {
      error: 'not exist',
      reason: 'version not found: ' + version
    };
    return;
  }
  this.body = pkg;
};

var _downloads = {};

exports.download = function *(next) {
  var name = this.params.name || this.params[0];
  var filename = this.params.filename || this.params[1];
  var version = filename.slice(name.length + 1, -4);
  var row = yield Module.get(name, version);
  // can not get dist
  var url = null;

  if (typeof nfs.url === 'function') {
    url = nfs.url(common.getCDNKey(name, filename));
  }

  debug('download %s %s %s %s', name, filename, version, url);

  if (!row || !row.package || !row.package.dist) {
    if (!url) {
      return yield* next;
    }
    this.status = 302;
    this.set('Location', url);
    _downloads[name] = (_downloads[name] || 0) + 1;
    return;
  }

  var dist = row.package.dist;
  if (!dist.key) {
    debug('get tarball by 302');
    this.status = 302;
    this.set('Location', dist.tarball || url);
    _downloads[name] = (_downloads[name] || 0) + 1;
    return;
  }

  // else use `dist.key` to get tarball from nfs
  if (!nfs.download) {
    return yield* next;
  }

  _downloads[name] = (_downloads[name] || 0) + 1;

  if (typeof dist.size === 'number') {
    this.length = dist.size;
  }
  this.type = mime.lookup(dist.key);
  this.attachment = filename;
  this.etag = dist.shasum;

  this.body = yield* downloadAsReadStream(dist.key);
};

setInterval(function () {
  // save download count
  var totals = [];
  for (var name in _downloads) {
    var count = _downloads[name];
    totals.push([name, count]);
  }
  _downloads = {};

  if (totals.length === 0) {
    return;
  }

  debug('save download total: %j', totals);

  var date = utility.YYYYMMDD();
  var next = function () {
    var item = totals.shift();
    if (!item) {
      // done
      return;
    }

    DownloadTotal.plusTotal({name: item[0], date: date, count: item[1]}, function (err) {
      if (!err) {
        return next();
      }

      logger.error(err);
      debug('save download %j error: %s', item, err);

      totals.push(item);
      // save to _downloads
      for (var i = 0; i < totals.length; i++) {
        var v = totals[i];
        var name = v[0];
        _downloads[name] = (_downloads[name] || 0) + v[1];
      }
      // end
    });
  };
  next();
}, 5000);

function _addDepsRelations(pkg) {
  var dependencies = Object.keys(pkg.dependencies || {});
  if (dependencies.length > config.maxDependencies) {
    dependencies = dependencies.slice(0, config.maxDependencies);
  }

  // add deps relations
  dependencies.forEach(function (depName) {
    ModuleDeps.add(depName, pkg.name, utility.noop);
  });
}

// old flows:
// 1. add()
// 2. upload()
// 3. updateLatest()
//
// new flows: only one request
// PUT /:name
exports.addPackageAndDist = function *(next) {
  // 'dist-tags': { latest: '0.0.2' },
  //  _attachments:
  // { 'nae-sandbox-0.0.2.tgz':
  //    { content_type: 'application/octet-stream',
  //      data: 'H4sIAAAAA
  //      length: 9883
  var pkg = this.request.body;
  var username = this.user.name;
  var name = this.params.name || this.params[0];
  var filename = Object.keys(pkg._attachments || {})[0];
  var version = Object.keys(pkg.versions || {})[0];
  if (!version) {
    this.status = 400;
    this.body = {
      error: 'version_error',
      reason: 'version ' + version + ' not found'
    };
    return;
  }

  var versionPackage = pkg.versions[version];

  if (!filename) {
    if (versionPackage.deprecated) {
      return yield* deprecateVersions.call(this, next);
    }

    this.status = 400;
    this.body = {
      error: 'filename_error',
      reason: 'filename ' + filename + ' not found'
    };
    return;
  }

  var attachment = pkg._attachments[filename];
  var maintainers = versionPackage.maintainers;

  // should never happened in normal request
  if (!maintainers) {
    this.status = 400;
    this.body = {
      error: 'maintainers error',
      reason: 'request body need maintainers'
    };
    return;
  }

  // notice that admins can not publish to all modules
  // (but admins can add self to maintainers first)

  // make sure user in auth is in maintainers
  // should never happened in normal request
  var m = maintainers.filter(function (maintainer) {
    return maintainer.name === username;
  });
  if (!m.length) {
    this.status = 403;
    this.body = {
      error: 'maintainers error',
      reason: username + ' does not in maintainer list'
    };
    return;
  }

  versionPackage._publish_on_cnpm = true;
  var distTags = pkg['dist-tags'] || {};
  var tags = []; // tag, version
  for (var t in distTags) {
    tags.push([t, distTags[t]]);
  }

  if (tags.length === 0) {
    this.status = 400;
    this.body = {
      error: 'invalid',
      reason: 'dist-tags should not be empty'
    };
    return;
  }

  debug('%s addPackageAndDist %s:%s, attachment size: %s, maintainers: %j, distTags: %j',
    username, name, version, attachment.length, versionPackage.maintainers, distTags);

  var exists = yield Module.get(name, version);
  var shasum;
  if (exists) {
    this.status = 403;
    this.body = {
      error: 'forbidden',
      reason: 'cannot modify pre-existing version: ' + version
    };
    return;
  }

  // check maintainers
  var isMaintainer = yield* packageService.isMaintainer(name, username);
  if (!isMaintainer) {
    this.status = 403;
    this.body = {
      error: 'forbidden user',
      reason: username + ' not authorized to modify ' + name
    };
    return;
  }

  // upload attachment
  var tarballBuffer;
  tarballBuffer = new Buffer(attachment.data, 'base64');

  if (tarballBuffer.length !== attachment.length) {
    this.status = 403;
    this.body = {
      error: 'size_wrong',
      reason: 'Attachment size ' + attachment.length
        + ' not match download size ' + tarballBuffer.length,
    };
    return;
  }

  if (!distTags.latest) {
    // need to check if latest tag exists or not
    var latest = yield Module.getByTag(name, 'latest');
    if (!latest) {
      // auto add latest
      tags.push(['latest', tags[0][1]]);
      debug('auto add latest tag: %j', tags);
    }
  }

  shasum = crypto.createHash('sha1');
  shasum.update(tarballBuffer);
  shasum = shasum.digest('hex');

  var options = {
    key: common.getCDNKey(name, filename),
    shasum: shasum
  };
  var uploadResult = yield nfs.uploadBuffer(tarballBuffer, options);
  debug('upload %j', uploadResult);

  var dist = {
    shasum: shasum,
    size: attachment.length
  };

  // if nfs upload return a key, record it
  if (uploadResult.url) {
    dist.tarball = uploadResult.url;
  } else if (uploadResult.key) {
    dist.key = uploadResult.key;
    dist.tarball = uploadResult.key;
  }

  var mod = {
    name: name,
    version: version,
    author: username,
    package: versionPackage
  };

  mod.package.dist = dist;
  _addDepsRelations(mod.package);

  var addResult = yield Module.add(mod);
  debug('%s module: save file to %s, size: %d, sha1: %s, dist: %j, version: %s',
    addResult.id, dist.tarball, dist.size, shasum, dist, version);

  if (tags.length) {
    yield tags.map(function (tag) {
      return Module.addTag(name, tag[0], tag[1]);
    });
  }

  // ensure maintainers exists
  yield* packageService.addMaintainers(name, maintainers.map(function (item) {
    return item.name;
  }));

  this.status = 201;
  this.body = {
    ok: true,
    rev: String(addResult.id)
  };
};

// PUT /:name/-rev/:rev
exports.updateOrRemove = function* (next) {
  var name = this.params.name || this.params[0];
  debug('updateOrRemove module %s, %s, %j', this.url, name, this.request.body);

  var body = this.request.body;
  if (body.versions) {
    yield* exports.removeWithVersions.call(this, next);
  } else if (body.maintainers) {
    yield* exports.updateMaintainers.call(this, next);
  } else {
    yield* next;
  }
};

exports.updateMaintainers = function* (next) {
  var name = this.params.name || this.params[0];
  var body = this.request.body;
  debug('updateMaintainers module %s, %j', name, body);

  var isMaintainer = yield* packageService.isMaintainer(name, this.user.name);

  if (!isMaintainer && !this.user.isAdmin) {
    this.status = 403;
    this.body = {
      error: 'forbidden user',
      reason: this.user.name + ' not authorized to modify ' + name
    };
    return;
  }

  var usernames = body.maintainers.map(function (user) {
    return user.name;
  });

  if (usernames.length === 0) {
    this.status = 403;
    this.body = {
      error: 'invalid operation',
      reason: 'Can not remove all maintainers'
    };
    return;
  }

  if (config.customUserService) {
    // ensure new authors are vaild
    var maintainers = yield* packageService.listMaintainerNamesOnly(name);
    var map = {};
    var newNames = [];
    for (var i = 0; i < maintainers.length; i++) {
      map[maintainers[i]] = 1;
    }
    for (var i = 0; i < usernames.length; i++) {
      var username = usernames[i];
      if (map[username] !== 1) {
        newNames.push(username);
      }
    }
    if (newNames.length > 0) {
      var users = yield* UserService.list(newNames);
      var map = {};
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        map[user.login] = 1;
      }
      var invailds = [];
      for (var i = 0; i < newNames.length; i++) {
        var username = newNames[i];
        if (map[username] !== 1) {
          invailds.push(username);
        }
      }
      if (invailds.length > 0) {
        this.status = 403;
        this.body = {
          error: 'invalid user name',
          reason: 'User: ' + invailds.join(', ') + ' not exists'
        };
        return;
      }
    }
  }

  var r = yield* packageService.updateMaintainers(name, usernames);
  debug('result: %j', r);

  this.status = 201;
  this.body = {
    ok: true,
    id: name,
    rev: this.params.rev || this.params[1],
  };
};

exports.removeWithVersions = function* (next) {
  var username = this.user.name;
  var name = this.params.name || this.params[0];
  // left versions
  var versions = this.request.body.versions || {};

  // step1: list all the versions
  var mods = yield Module.listByName(name);
  debug('removeWithVersions module %s, left versions %j, %s mods',
    name, Object.keys(versions), mods && mods.length);
  if (!mods || !mods.length) {
    return yield* next;
  }

  // step2: check permission
  var isMaintainer = yield* packageService.isMaintainer(name, username);
  // admin can delete the module
  if (!isMaintainer && !this.user.isAdmin) {
    this.status = 403;
    this.body = {
      error: 'forbidden user',
      reason: username + ' not authorized to modify ' + name
    };
    return;
  }

  // step3: calculate which versions need to remove and
  // which versions need to remain
  var removeVersions = [];
  var removeVersionMaps = {};
  var remainVersions = [];

  for (var i = 0; i < mods.length; i++) {
    var v = mods[i].version;
    if (v === 'next') {
      continue;
    }
    if (!versions[v]) {
      removeVersions.push(v);
      removeVersionMaps[v] = true;
    } else {
      remainVersions.push(v);
    }
  }

  if (!removeVersions.length) {
    debug('no versions need to remove');
    this.status = 201;
    this.body = { ok: true };
    return;
  }
  debug('remove versions: %j, remain versions: %j', removeVersions, remainVersions);

  // step 4: remove all the versions which need to remove
  // let removeTar do remove versions from module table
  var tags = yield Module.listTags(name);

  var removeTags = [];
  var latestRemoved = false;
  tags.forEach(function (tag) {
    // this tag need be removed
    if (removeVersionMaps[tag.version]) {
      removeTags.push(tag.id);
      if (tag.tag === 'latest') {
        latestRemoved = true;
      }
    }
  });
  if (removeTags.length) {
    debug('remove tags: %j', removeTags);
    // step 5: remove all the tags
    yield Module.removeTagsByIds(removeTags);
    if (latestRemoved && remainVersions[0]) {
      debug('latest tags removed, generate a new latest tag with new version: %s',
          remainVersions[0]);
      // step 6: insert new latest tag
      yield Module.addTag(name, 'latest', remainVersions[0]);
    }
  } else {
    debug('no tag need to be remove');
  }
  // step 7: update last modified, make sure etag change
  yield* Module.updateLastModified(name);

  this.status = 201;
  this.body = { ok: true };
};

exports.removeTar = function* (next) {
  var name = this.params.name || this.params[0];
  var filename = this.params.filename || this.params[1];
  var id = Number(this.params.rev || this.params[2]);
  // cnpmjs.org-2.0.0.tgz
  var version = filename.split(name + '-')[1];
  if (version) {
    // 2.0.0.tgz
    version = version.substring(0, version.lastIndexOf('.tgz'));
  }
  if (!version) {
    return yield* next;
  }

  debug('remove tarball with filename: %s, version: %s, revert to => rev id: %s', filename, version, id);

  var username = this.user.name;
  if (isNaN(id)) {
    return yield* next;
  }

  var isMaintainer = yield* packageService.isMaintainer(name, username);
  if (!isMaintainer && !this.user.isAdmin) {
    this.status = 403;
    this.body = {
      error: 'forbidden user',
      reason: username + ' not authorized to modify ' + name
    };
    return;
  }

  var rs = yield [
    Module.getById(id),
    Module.get(name, version),
  ];
  var revertTo = rs[0];
  var mod = rs[1]; // module need to delete
  if (!mod || mod.name !== name) {
    return yield* next;
  }

  var key = mod.package && mod.package.dist && mod.package.dist.key;
  key = key || common.getCDNKey(mod.name, filename);

  if (revertTo && revertTo.package) {
    debug('removing key: %s from nfs, revert to %s@%s', key, revertTo.name, revertTo.package.version);
  } else {
    debug('removing key: %s from nfs, no revert mod', key);
  }
  try {
    yield nfs.remove(key);
  } catch (err) {
    logger.error(err);
  }
  // remove version from table
  yield Module.removeByNameAndVersions(name, [version]);
  debug('removed %s@%s', name, version);
  this.body = { ok: true };
};

exports.removeAll = function* (next) {
  var name = this.params.name || this.params[0];
  var username = this.user.name;
  var rev = this.params.rev || this.params[1];
  debug('remove all the module with name: %s, id: %s', name, rev);

  var mods = yield Module.listByName(name);
  debug('removeAll module %s: %d', name, mods.length);
  var mod = mods[0];
  if (!mod) {
    return yield* next;
  }

  var isMaintainer = yield* packageService.isMaintainer(name, username);
  // admin can delete the module
  if (!isMaintainer && !this.user.isAdmin) {
    this.status = 403;
    this.body = {
      error: 'forbidden user',
      reason: username + ' not authorized to modify ' + name
    };
    return;
  }
  Total.plusDeleteModule(utility.noop);
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
  if (keys.length > 0) {
    try {
      yield keys.map(function (key) {
        return nfs.remove(key);
      });
    } catch (err) {
      // ignore error here
    }
  }

  // remove the maintainers
  yield* packageService.removeAllMaintainers(name);

  this.body = { ok: true };
};

function parseModsForList(updated, mods, ctx) {
  var results = {
    _updated: updated
  };

  for (var i = 0; i < mods.length; i++) {
    var mod = mods[i];
    var pkg = {};
    try {
      pkg = JSON.parse(mod.package);
    } catch (e) {
      //ignore this pkg
      continue;
    }
    pkg['dist-tags'] = {
      latest: pkg.version
    };
    common.setDownloadURL(pkg, ctx);
    results[mod.name] = pkg;
  }
  return results;
}

exports.listAllModules = function *() {
  var updated = Date.now();
  var mods = yield Module.listAllNames();
  var result = { _updated: updated };
  mods.forEach(function (mod) {
    result[mod.name] = true;
  });
  this.body = result;
};

var A_WEEK_MS = 3600000 * 24 * 7;

exports.listAllModulesSince = function *() {
  var query = this.query || {};
  if (query.stale !== 'update_after') {
    this.status = 400;
    this.body = {
      error: 'query_parse_error',
      reason: 'Invalid value for `stale`.'
    };
    return;
  }

  debug('list all modules from %s', query.startkey);
  var startkey = Number(query.startkey) || 0;
  var updated = Date.now();
  if (updated - startkey > A_WEEK_MS) {
    startkey = updated - A_WEEK_MS;
    console.warn('[%s] list modules since time out of range: query: %j, ip: %s',
      Date(), query, this.ip);
  }
  var mods = yield Module.listSince(startkey);
  var result = { _updated: updated };
  mods.forEach(function (mod) {
    result[mod.name] = true;
  });

  this.body = result;
};

exports.listAllModuleNames = function *() {
  this.body = (yield Module.listShort()).map(function (m) {
    return m.name;
  });
};

// PUT /:name/:tag
exports.updateTag = function* () {
  var version = this.request.body;
  var name = this.params.name || this.params[0];
  var tag = this.params.tag || this.params[1];
  debug('updateTag: %s %s to %s', name, version, tag);

  if (!version) {
    this.status = 400;
    this.body = {
      error: 'version_missed',
      reason: 'version not found'
    };
    return;
  }

  if (!semver.valid(version)) {
    this.status = 403;
    var reason = util.format('setting tag %s to invalid version: %s: %s/%s',
      tag, version, name, tag);
    this.body = {
      error: 'forbidden',
      reason: reason
    };
    return;
  }

  var mod = yield Module.get(name, version);
  if (!mod) {
    this.status = 403;
    var reason = util.format('setting tag %s to unknown version: %s: %s/%s',
      tag, version, name, tag);
    this.body = {
      error: 'forbidden',
      reason: reason
    };
    return;
  }

  // check permission
  var isMaintainer = yield* packageService.isMaintainer(name, this.user.name);
  if (!isMaintainer && !this.user.isAdmin) {
    this.status = 403;
    this.body = {
      error: 'forbidden user',
      reason: this.user.name + ' not authorized to modify ' + name
    };
    return;
  }

  yield Module.addTag(name, tag, version);
  this.status = 201;
  this.body = {
    ok: true
  };
};
