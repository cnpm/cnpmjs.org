'use strict';

var debug = require('debug')('cnpmjs.org:controllers:registry:package:remove_version');
var packageService = require('../../../services/package');
var nfs = require('../../../common/nfs');
var logger = require('../../../common/logger');
var getCDNKey = require('../../../lib/common').getCDNKey;

// DELETE /:name/download/:filename/-rev/:rev
// https://github.com/npm/npm-registry-client/blob/master/lib/unpublish.js#L97
module.exports = function* removeOneVersion(next) {
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
    return yield next;
  }

  debug('remove tarball with filename: %s, version: %s, revert to => rev id: %s', filename, version, id);

  if (isNaN(id)) {
    return yield next;
  }

  var rs = yield [
    packageService.getModuleById(id),
    packageService.getModule(name, version),
  ];
  var revertTo = rs[0];
  var mod = rs[1]; // module need to delete
  if (!mod || mod.name !== name) {
    return yield next;
  }

  var key = mod.package && mod.package.dist && mod.package.dist.key;
  if (!key) {
    key = getCDNKey(mod.name, filename);
  }

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
  yield packageService.removeModulesByNameAndVersions(name, [version]);
  debug('removed %s@%s', name, version);
  this.body = { ok: true };
};
