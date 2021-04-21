'use strict';

var debug = require('debug')('cnpmjs.org:controllers:registry:package:show');
var packageService = require('../../../services/package');
var SyncModuleWorker = require('../../sync_module_worker');
var config = require('../../../config');

/**
 * [deprecate] api
 *
 * get the special version or tag of a module
 *
 * GET /:name/:version
 * GET /:name/:tag
 */
module.exports = function* show() {
  var name = this.params.name || this.params[0];
  var tag = this.params.version || this.params[1];
  var mod = yield packageService.showPackage(name, tag);

  if (mod) {
    if (typeof config.formatCustomOnePackageVersion === 'function') {
      mod.package = config.formatCustomOnePackageVersion(this, mod.package);
    }

    this.jsonp = mod.package;
    if (config.registryCacheControlHeader) {
      this.set('cache-control', config.registryCacheControlHeader);
    }
    if (config.registryVaryHeader) {
      this.set('vary', config.registryVaryHeader);
    }
    return;
  }

  // if not fond, sync from source registry
  if (!this.allowSync) {
    this.status = 404;
    const error = '[not_exists] version not found: ' + tag;
    this.jsonp = {
      error,
      reason: error,
    };
    return;
  }

  // start sync
  var logId = yield SyncModuleWorker.sync(name, 'sync-by-install');
  debug('start sync %s, get log id %s', name, logId);

  this.redirect(config.officialNpmRegistry + this.url);
};
