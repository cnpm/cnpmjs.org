'use strict';

var debug = require('debug')('cnpmjs.org:controllers:registry:package:remove');
var urlparse = require('url').parse;
var packageService = require('../../../services/package');
var totalService = require('../../../services/total');
var nfs = require('../../../common/nfs');
var logger = require('../../../common/logger');

// DELETE /:name/-rev/:rev
// https://github.com/npm/npm-registry-client/blob/master/lib/unpublish.js#L25
module.exports = function* remove(next) {
  var name = this.params.name || this.params[0];
  var rev = this.params.rev || this.params[1];
  debug('remove all the module with name: %s, id: %s', name, rev);

  var mods = yield packageService.listModulesByName(name);
  debug('removeAll module %s: %d', name, mods.length);
  var mod = mods[0];
  if (!mod) {
    return yield next;
  }

  yield [
    packageService.removeModulesByName(name),
    packageService.removeModuleTags(name),
    totalService.plusDeleteModule(),
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

  try {
    yield keys.map(function (key) {
      return nfs.remove(key);
    });
  } catch (err) {
    logger.error(err);
  }

  // remove the maintainers
  yield packageService.removeAllMaintainers(name);

  this.body = { ok: true };
};
