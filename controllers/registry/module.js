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

/**
 * show all version of a module
 */
exports.show = function *(next) {
  var name = this.params.name;
  var modifiedTime = yield *Module.getLastModified(name);
  debug('show %s, last modified: %s', name, modifiedTime);
  if (modifiedTime) {
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
    Module.listTags(name),
    Module.listByName(name),
    ModuleStar.listUsers(name)
  ];
  var tags = r[0];
  var rows = r[1];
  var users = r[2];
  var userMap = {};
  for (var i = 0; i < users.length; i++) {
    userMap[users[i]] = true;
  }
  users = userMap;
  // if module not exist in this registry,
  // sync the module backend and return package info from official registry
  if (rows.length === 0) {
    if (!this.allowSync) {
      this.status = 404;
      this.body = {
        error: 'not_found',
        reason: 'document not found'
      };
      return;
    }
    var result = yield SyncModuleWorker.sync(name, 'sync-by-install');
    this.status = result.ok ? 200 : (result.statusCode || 500);
    this.body = result.pkg;
    return;
  }

  var nextMod = null;
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
    if (row.version === 'next') {
      nextMod = row;
      continue;
    }
    var pkg = row.package;
    common.setDownloadURL(pkg, this);
    pkg._cnpm_publish_time = row.publish_time;
    versions[pkg.version] = pkg;
    var t = times[pkg.version] = row.publish_time ? new Date(row.publish_time) : row.gmt_modified;
    if ((!distTags.latest && !latestMod) || distTags.latest === row.version) {
      latestMod = row;
      readme = pkg.readme;
    }
    delete pkg.readme;

    if (!createdTime || t < createdTime) {
      createdTime = t;
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
    latestMod = nextMod || rows[0];
  }

  if (!nextMod) {
    nextMod = latestMod;
  }

  var rev = '';
  if (nextMod) {
    rev = String(nextMod.id);
  }

  var pkg = latestMod.package;

  var info = {
    _id: name,
    _rev: rev,
    name: name,
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

  debug('show module %s: %s, latest: %s', name, rev, latestMod.version);
  this.body = info;
};

/**
 * get the special version or tag of a module
 */
exports.get = function *(next) {
  var name = this.params.name;
  var tag = this.params.version;
  var version = semver.valid(tag);
  var method = version ? 'get' : 'getByTag';
  var queryLabel = version ? version : tag;

  var mod = yield Module[method](name, queryLabel);
  if (mod) {
    common.setDownloadURL(mod.package, this);
    mod.package._cnpm_publish_time = mod.publish_time;
    this.body = mod.package;
    return;
  }
  // if not fond, sync from source registry
  if (!this.allowSync) {
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

var DOWNLOAD_TIMEOUT = ms('10m');

exports.download = function *(next) {
  var name = this.params.name;
  var filename = this.params.filename;
  var version = filename.slice(name.length + 1, -4);
  var row = yield Module.get(name, version);
  // can not get dist
  var url = null;

  if (typeof nfs.url === 'function') {
    url = nfs.url(common.getCDNKey(name, filename));
  }

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
    this.set('Content-Length', dist.size);
  }
  this.set('Content-Type', mime.lookup(dist.key));
  this.set('Content-Disposition', 'attachment; filename="' + filename + '"');
  this.set('ETag', dist.shasum);

  // use download file api
  var tmpPath = path.join(config.uploadDir,
    utility.randomString() + dist.key.replace(/\//g, '-'));
  function cleanup() {
    fs.unlink(tmpPath, utility.noop);
  }
  try {
    yield nfs.download(dist.key, tmpPath, {timeout: DOWNLOAD_TIMEOUT});
  } catch (err) {
    cleanup();
    this.throw(err);
  }
  var tarball = fs.createReadStream(tmpPath);
  tarball.once('error', cleanup);
  tarball.once('end', cleanup);
  this.body = tarball;
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

exports.upload = function *(next) {
  var length = Number(this.get('content-length')) || 0;
  if (!length || !this.is('application/octet-stream')) {
    debug('request length or type error');
    return yield *next;
  }
  var username = this.user.name;
  var name = this.params.name;
  var id = Number(this.params.rev);
  var filename = this.params.filename;
  var version = filename.substring(name.length + 1);
  version = version.replace(/\.tgz$/, '');
  // save version on pkg upload

  debug('%s: upload %s, file size: %d', username, this.url, length);
  var mod = yield Module.getById(id);
  if (!mod) {
    debug('can not get this module');
    return yield* next;
  }
  if (!common.isMaintainer(this.user, mod.package.maintainers) || mod.name !== name) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Current user can not publish this module'
    };
    return;
  }

  if (mod.version !== 'next') {
    // rev wrong
    this.status = 403;
    this.body = {
      error: 'rev_wrong',
      reason: 'rev not match next module'
    };
    return;
  }
  var filepath = common.getTarballFilepath(filename);
  var ws = fs.createWriteStream(filepath);
  var shasum = crypto.createHash('sha1');
  var dataSize = 0;

  var buf;
  while (buf = yield coRead(this.req)) {
    shasum.update(buf);
    dataSize += buf.length;
    yield coWrite(ws, buf);
  }
  ws.end();
  if (dataSize !== length) {
    this.status = 403;
    this.body = {
      error: 'size_wrong',
      reason: 'Header size ' + length + ' not match download size ' + dataSize,
    };
    return;
  }
  shasum = shasum.digest('hex');

  var options = {
    key: common.getCDNKey(name, filename),
    size: length,
    shasum: shasum
  };
  var result;
  try {
    result = yield nfs.upload(filepath, options);
  } catch (err) {
    fs.unlink(filepath, utility.noop);
    this.throw(err);
  }
  fs.unlink(filepath, utility.noop);
  var dist = {
    shasum: shasum,
    size: length
  };

  // if nfs upload return a key, record it
  if (result.url) {
    dist.tarball = result.url;
  } else if (result.key) {
    dist.key = result.key;
    dist.tarball = result.key;
  }

  mod.package.dist = dist;
  mod.package.version = version;
  debug('%s module: save file to %s, size: %d, sha1: %s, dist: %j, version: %s',
    id, filepath, length, shasum, dist, version);
  var updateResult = yield Module.update(mod);
  this.status = 201;
  this.body = {
    ok: true,
    rev: String(updateResult.id)
  };
};

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

exports.updateLatest = function *(next) {
  var username = this.user.name;
  var name = this.params.name;
  var version = semver.valid(this.params.version);
  if (!version) {
    this.status = 400;
    this.body = {
      error: 'Params Invalid',
      reason: 'Invalid version: ' + this.params.version,
    };
    return;
  }

  var nextMod = yield Module.get(name, 'next');
  if (!nextMod) {
    debug('can not get nextMod');
    return yield* next;
  }
  if (!common.isMaintainer(this.user, nextMod.package.maintainers)) {
    this.status = 401;
    this.body = {
      error: 'noperms',
      reason: 'Current user can not publish this module'
    };
    return;
  }

  // check version if not match pkg upload
  if (nextMod.package.version !== version) {
    this.status = 403;
    this.body = {
      error: 'version_wrong',
      reason: 'version not match'
    };
    return;
  }

  var body = this.request.body;
  nextMod.version = version;
  nextMod.author = username;
  body.dist = nextMod.package.dist;
  body.maintainers = nextMod.package.maintainers;
  if (!body.author) {
    body.author = {
      name: username,
    };
  }
  body._publish_on_cnpm = true;
  nextMod.package = body;
  _addDepsRelations(body);

  // reset publish time
  nextMod.publish_time = Date.now();
  debug('update %s:%s %j', nextMod.package.name, nextMod.package.version, nextMod.package.dist);
  // change latest to version
  try {
    yield Module.update(nextMod);
  } catch (err) {
    debug('update nextMod %s error: %s', name, err);
    return this.throw(err);
  }
  yield Module.addTag(name, 'latest', version);
  nextMod.version = 'next';
  var addResult = yield Module.add(nextMod);
  this.status = 201;
  this.body = {
    ok: true,
    rev: String(addResult.id)
  };
};

exports.addPackageAndDist = function *(next) {
  // 'dist-tags': { latest: '0.0.2' },
  //  _attachments:
  // { 'nae-sandbox-0.0.2.tgz':
  //    { content_type: 'application/octet-stream',
  //      data: 'H4sIAAAAA
  //      length: 9883

  var pkg = this.request.body;
  var username = this.user.name;
  var name = this.params.name;
  var filename = Object.keys(pkg._attachments || {})[0];
  var version = Object.keys(pkg.versions || {})[0];
  if (!version || !filename) {
    this.status = 400;
    this.body = {
      error: 'version_error',
      reason: 'filename or version not found, filename: ' + filename + ', version: ' + version
    };
    return;
  }

  var attachment = pkg._attachments[filename];
  var versionPackage = pkg.versions[version];
  versionPackage._publish_on_cnpm = true;
  var distTags = pkg['dist-tags'] || {};
  var tags = []; // tag, version
  for (var t in distTags) {
    tags.push([t, distTags[t]]);
  }

  debug('addPackageAndDist %s:%s, attachment size: %s', name, version, attachment.length);


  var exists = yield Module.get(name, version);
  var shasum;
  if (exists) {
    this.status = 409;
    this.body = {
      error: 'conflict',
      reason: 'Document update conflict.'
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
      reason: 'Attachment size ' + attachment.length + ' not match download size ' + tarballBuffer.length,
    };
    return;
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

  this.status = 201;
  this.body = {
    ok: true,
    rev: String(addResult.id)
  };
};

exports.add = function *(next) {
  var username = this.user.name;
  var name = this.params.name;
  var pkg = this.request.body || {};

  if (!common.isMaintainer(this.user, pkg.maintainers)) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Current user can not publish this module'
    };
    return;
  }

  if (pkg._attachments && Object.keys(pkg._attachments).length > 0) {
    return yield exports.addPackageAndDist.call(this, next);
  }

  var r = yield [Module.getLatest(name), Module.get(name, 'next')];
  var latestMod = r[0];
  var nextMod = r[1];

  if (nextMod) {
    nextMod.exists = true;
  } else {
    nextMod = {
      name: name,
      version: 'next',
      author: username,
      package: {
        name: name,
        version: 'next',
        description: pkg.description,
        readme: pkg.readme,
        maintainers: pkg.maintainers,
      }
    };
    debug('add next module: %s', name);
    var result = yield Module.add(nextMod);
    nextMod.id = result.id;
  }

  var maintainers = latestMod && latestMod.package.maintainers.length > 0 ?
    latestMod.package.maintainers : nextMod.package.maintainers;

  if (!common.isMaintainer(this.user, maintainers)) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Current user can not publish this module'
    };
    return;
  }

  debug('add %s rev: %s, version: %s', name, nextMod.id, nextMod.version);

  if (latestMod || nextMod.version !== 'next') {
    this.status = 409;
    this.body = {
      error: 'conflict',
      reason: 'Document update conflict.'
    };
    return;
  }
  this.status = 201;
  this.body = {
    ok: true,
    id: name,
    rev: String(nextMod.id),
  };
};

exports.updateOrRemove = function *(next) {
  debug('updateOrRemove module %s, %j', this.params.name, this.request.body);
  var body = this.request.body;
  if (body.versions) {
    yield *exports.removeWithVersions.call(this, next);
  } else if (body.maintainers && body.maintainers.length > 0) {
    yield *exports.updateMaintainers.call(this, next);
  } else {
    yield *next;
  }
};

exports.updateMaintainers = function *(next) {
  var name = this.params.name;
  var body = this.request.body;
  debug('updateMaintainers module %s, %j', name, body);

  var latestMod = yield Module.getLatest(name);

  if (!latestMod || !latestMod.package) {
    return yield *next;
  }
  if (!common.isMaintainer(this.user, latestMod.package.maintainers)) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Current user can not publish this module'
    };
    return;
  }

  var r = yield *Module.updateMaintainers(latestMod.id, body.maintainers);
  debug('result: %j', r);

  this.status = 201;
  this.body = {
    ok: true,
    id: name,
    rev: String(latestMod.id),
  };
};

exports.removeWithVersions = function *(next) {
  debug('removeWithVersions module %s, with info %j', this.params.name, this.request.body);
  var username = this.user.name;
  var name = this.params.name;
  var versions = this.request.body.versions || {};

  debug('removeWithVersions module %s, with versions %j', name, Object.keys(versions));

  // step1: list all the versions
  var mods = yield Module.listByName(name);
  if (!mods || !mods.length) {
    return yield *next;
  }

  // step2: check permission
  var firstMod = mods[0];
  if (!common.isMaintainer(this.user, firstMod.package.maintainers) || firstMod.name !== name) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Current user can not update this module'
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
  yield Module.removeByNameAndVersions(name, removeVersions);
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
  this.status = 201;
  this.body = { ok: true };
};

exports.removeTar = function *(next) {
  debug('remove tarball with filename: %s, id: %s', this.params.filename, this.params.rev);
  var id = Number(this.params.rev);
  var filename = this.params.filename;
  var name = this.params.name;
  var username = this.user.name;

  var mod = yield Module.getById(id);
  if (!mod) {
    return yield* next;
  }

  if (!common.isMaintainer(this.user, mod.package.maintainers) || mod.name !== name) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Current user can not delete this tarball'
    };
    return;
  }
  var key = mod.package.dist && mod.package.dist.key;
  key = key || common.getCDNKey(mod.name, filename);
  yield nfs.remove(key);
  this.body = { ok: true };
};

exports.removeAll = function *(next) {
  debug('remove all the module with name: %s, id: %s', this.params.name, this.params.rev);
  // var id = Number(this.params.rev);
  var name = this.params.name;

  var mods = yield Module.listByName(name);
  debug('removeAll module %s: %d', name, mods.length);
  var mod = mods[0];
  if (!mod) {
    return yield* next;
  }

  if (!common.isMaintainer(this.user, mod.package.maintainers) || mod.name !== name) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Current user can not delete this tarball'
    };
    return;
  }
  Total.plusDeleteModule(utility.noop);
  yield [Module.removeByName(name), Module.removeTags(name)];
  var keys = [];
  for (var i = 0; i < mods.length; i++) {
    var key = urlparse(mods[i].dist_tarball).path;
    key && keys.push(key);
  }
  try {
    yield keys.map(function (key) {
      return nfs.remove(key);
    });
  } catch (err) {
    // ignore error here
  }
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

exports.updateTag = function *() {
  var version = this.request.body;
  var tag = this.params.tag;
  var name = this.params.name;

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

  yield Module.addTag(name, tag, version);
  this.status = 201;
  this.body = {
    ok: true
  };
};
