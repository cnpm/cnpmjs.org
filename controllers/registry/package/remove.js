/**!
 * cnpmjs.org - controllers/registry/package/remove.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

const debug = require('debug')('cnpmjs.org:controllers:registry:package:remove');
const urlparse = require('url').parse;
const packageService = require('../../../services/package');
const totalService = require('../../../services/total');
const nfs = require('../../../common/nfs');
const logger = require('../../../common/logger');

// DELETE /:name/-rev/:rev
// https://github.com/npm/npm-registry-client/blob/master/lib/unpublish.js#L25
module.exports = function* remove(next) {
  const name = this.params.name || this.params[0];
  const rev = this.params.rev || this.params[1];
  debug('remove all the module with name: %s, id: %s', name, rev);

  const mods = yield packageService.listModulesByName(name);
  debug('removeAll module %s: %d', name, mods.length);
  const mod = mods[0];
  if (!mod) {
    return yield next;
  }

  yield [
    packageService.removeModulesByName(name),
    packageService.removeModuleTags(name),
    totalService.plusDeleteModule(),
  ];

  const keys = [];
  for (let i = 0; i < mods.length; i++) {
    const row = mods[i];
    const dist = row.package.dist;
    let key = dist.key;
    if (!key) {
      key = urlparse(dist.tarball).pathname;
    }
    key && keys.push(key);
  }

  try {
    yield keys.map(function(key) {
      return nfs.remove(key);
    });
  } catch (err) {
    logger.error(err);
  }

  // remove the maintainers
  yield packageService.removeAllMaintainers(name);

  this.body = { ok: true };
};
