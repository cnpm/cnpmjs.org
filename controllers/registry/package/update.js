'use strict';

var debug = require('debug')('cnpmjs.org:controllers:registry:package:update');
var packageService = require('../../../services/package');
var userService = require('../../../services/user');
var config = require('../../../config');

// PUT /:name/-rev/:rev
//
// * remove with versions, then will `DELETE /:name/download/:filename/-rev/:rev`
// * ...
module.exports = function* update(next) {
  var name = this.params.name || this.params[0];
  debug('update module %s, %s, %j', this.url, name, this.request.body);

  var body = this.request.body;
  if (body.versions) {
    yield updateVersions.call(this, next);
  } else if (body.maintainers) {
    yield updateMaintainers.call(this, next);
  } else {
    yield next;
  }
};

// update with versions
// https://github.com/npm/npm-registry-client/blob/master/lib/unpublish.js#L63
function* updateVersions(next) {
  var name = this.params.name || this.params[0];
  // left versions
  var versions = this.request.body.versions;

  // step1: list all the versions
  var mods = yield packageService.listModulesByName(name);
  debug('removeWithVersions module %s, left versions %j, %s mods',
    name, Object.keys(versions), mods && mods.length);
  if (!mods || !mods.length) {
    return yield next;
  }

  // step3: calculate which versions need to remove and
  // which versions need to remain
  var removeVersions = [];
  var removeVersionMaps = {};
  var remainVersions = [];

  for (var i = 0; i < mods.length; i++) {
    var v = mods[i].version;
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
  var tags = yield packageService.listModuleTags(name);

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

  debug('remove tags: %j', removeTags);
  if (removeTags.length) {
    // step 5: remove all the tags
    yield packageService.removeModuleTagsByIds(removeTags);
    if (latestRemoved && remainVersions[0]) {
      debug('latest tags removed, generate a new latest tag with new version: %s',
        remainVersions[0]);
      // step 6: insert new latest tag
      yield packageService.addModuleTag(name, 'latest', remainVersions[0]);
    }
  }

  // step 7: update last modified, make sure etag change
  yield packageService.updateModuleLastModified(name);

  this.status = 201;
  this.body = { ok: true };
}

function* updateMaintainers() {
  var name = this.params.name || this.params[0];
  var body = this.request.body;
  debug('updateMaintainers module %s, %j', name, body);

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
    var maintainers = yield packageService.listMaintainerNamesOnly(name);
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
      var users = yield userService.list(newNames);
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

  var r = yield packageService.updatePrivateModuleMaintainers(name, usernames);
  debug('result: %j', r);

  this.status = 201;
  this.body = {
    ok: true,
    id: name,
    rev: this.params.rev || this.params[1],
  };
}
