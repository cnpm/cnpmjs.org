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
var util = require('util');
var urlparse = require('url').parse;
var semver = require('semver');
var config = require('../../config');
var Total = require('../../services/total');
var nfs = require('../../common/nfs');
var common = require('../../lib/common');
var logger = require('../../common/logger');
// var ModuleUnpublished = require('../../proxy/module_unpublished');
var packageService = require('../../services/package');
var userService = require('../../services/user');


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

exports.updateMaintainers = function* () {
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
      var users = yield* userService.list(newNames);
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
          reason: 'User: `' + invailds.join(', ') + '` not exists'
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
  yield* Module.updateModuleLastModified(name);

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
    Package.getModule(name, version),
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
  yield [
    Module.removeByName(name),
    Module.removeTags(name),
    Total.plusDeleteModule(),
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
