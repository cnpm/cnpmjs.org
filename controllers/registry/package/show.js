'use strict';

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
  if (tag === '*') {
    tag = 'latest';
  }
  var version = semver.valid(tag);
  var range = semver.validRange(tag);
  var mod;
  if (version) {
    mod = yield packageService.getModule(name, version);
  } else if (range) {
    mod = yield packageService.getModuleByRange(name, range);
  } else {
    mod = yield packageService.getModuleByTag(name, tag);
  }

  if (mod) {
    setDownloadURL(mod.package, this);
    mod.package._cnpm_publish_time = mod.publish_time;
    mod.package.publish_time = mod.package.publish_time || mod.publish_time;
    var rs = yield [
      packageService.listMaintainers(name),
      packageService.listModuleTags(name),
    ];
    var maintainers = rs[0];
    if (maintainers.length > 0) {
      mod.package.maintainers = maintainers;
    }
    var tags = rs[1];
    var distTags = {};
    for (var i = 0; i < tags.length; i++) {
      var t = tags[i];
      distTags[t.tag] = t.version;
    }
    // show tags for npminstall faster download
    mod.package['dist-tags'] = distTags;
    this.jsonp = mod.package;
    return;
  }

  // if not fond, sync from source registry
  if (!this.allowSync) {
    this.status = 404;
    this.jsonp = {
      error: 'not exist',
      reason: 'version not found: ' + version
    };
    return;
  }

  // start sync
  var logId = yield SyncModuleWorker.sync(name, 'sync-by-install');
  debug('start sync %s, get log id %s', name, logId);

  this.redirect(config.officialNpmRegistry + this.url);
};
