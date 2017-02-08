'use strict';

const debug = require('debug')('cnpmjs.org:controllers:registry:package:show');
const semver = require('semver');
const packageService = require('../../../services/package');
const setDownloadURL = require('../../../lib/common').setDownloadURL;
const SyncModuleWorker = require('../../sync_module_worker');
const config = require('../../../config');

/**
 * [deprecate] api
 *
 * get the special version or tag of a module
 *
 * GET /:name/:version
 * GET /:name/:tag
 */
module.exports = function* show() {
  const name = this.params.name || this.params[0];
  let tag = this.params.version || this.params[1];
  if (tag === '*') {
    tag = 'latest';
  }
  const version = semver.valid(tag);
  const range = semver.validRange(tag);
  let mod;
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
    const rs = yield [
      packageService.listMaintainers(name),
      packageService.listModuleTags(name),
    ];
    const maintainers = rs[0];
    if (maintainers.length > 0) {
      mod.package.maintainers = maintainers;
    }
    const tags = rs[1];
    const distTags = {};
    for (let i = 0; i < tags.length; i++) {
      const t = tags[i];
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
      reason: 'version not found: ' + version,
    };
    return;
  }

  // start sync
  const logId = yield SyncModuleWorker.sync(name, 'sync-by-install');
  debug('start sync %s, get log id %s', name, logId);

  this.redirect(config.officialNpmRegistry + this.url);
};
