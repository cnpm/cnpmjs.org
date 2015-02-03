/**!
 * cnpmjs.js - controllers/registry/package/show.js
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

var debug = require('debug')('cnpmjs.org:controllers:registry:package:show');
var semver = require('semver');
var packageService = require('../../../services/package');
var setDownloadURL = require('../../../lib/common').setDownloadURL;
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
  var version = semver.valid(tag);
  var mod;
  if (version) {
    mod = yield* packageService.getModule(name, version);
  } else {
    mod = yield* packageService.getModuleByTag(name, tag);
  }
  if (mod) {
    setDownloadURL(mod.package, this);
    mod.package._cnpm_publish_time = mod.publish_time;
    var maintainers = yield* packageService.listMaintainers(name);
    if (maintainers.length > 0) {
      mod.package.maintainers = maintainers;
    }
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

  // start sync
  var logId = yield* SyncModuleWorker.sync(name, 'sync-by-install');
  debug('start sync %s, get log id %s', name, logId);

  this.redirect(config.officialNpmRegistry + this.url);
};
