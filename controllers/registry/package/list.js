'use strict';

const debug = require('debug')('cnpmjs.org:controllers:registry:package:list');
const packageService = require('../../../services/package');
const common = require('../../../lib/common');
const SyncModuleWorker = require('../../sync_module_worker');
const config = require('../../../config');

/**
 * list all version of a module
 * GET /:name
 */

module.exports = function* list() {
  const orginalName = this.params.name || this.params[0];
  const name = orginalName;
  const rs = yield [
    packageService.getModuleLastModified(name),
    packageService.listModuleTags(name),
  ];
  let modifiedTime = rs[0];
  const tags = rs[1];

  debug('show %s(%s), last modified: %s, tags: %j', name, orginalName, modifiedTime, tags);
  if (modifiedTime) {
    // find out the latest modfied time
    // because update tags only modfied tag, wont change module gmt_modified
    for (const tag of tags) {
      if (tag.gmt_modified > modifiedTime) {
        modifiedTime = tag.gmt_modified;
      }
    }

    // must set status first
    this.status = 200;
    if (this.fresh) {
      debug('%s not change at %s, 304 return', name, modifiedTime);
      this.status = 304;
      return;
    }
  }

  const r = yield [
    packageService.listModulesByName(name),
    packageService.listStarUserNames(name),
    packageService.listMaintainers(name),
  ];
  const rows = r[0];
  let starUsers = r[1];
  const maintainers = r[2];

  debug('show %s got %d rows, %d tags, %d star users, maintainers: %j',
    name, rows.length, tags.length, starUsers.length, maintainers);

  const starUserMap = {};
  for (const starUser of starUsers) {
    if (starUser[0] !== '"' && starUser[0] !== "'") {
      starUserMap[starUser] = true;
    }
  }
  starUsers = starUserMap;

  if (rows.length === 0) {
    // check if unpublished
    const unpublishedInfo = yield packageService.getUnpublishedModule(name);
    debug('show unpublished %j', unpublishedInfo);
    if (unpublishedInfo) {
      this.status = 404;
      this.body = {
        _id: orginalName,
        name: orginalName,
        time: {
          modified: unpublishedInfo.package.time,
          unpublished: unpublishedInfo.package,
        },
        _attachments: {},
      };
      return;
    }
  }

  // if module not exist in this registry,
  // sync the module backend and return package info from official registry
  if (rows.length === 0) {
    if (!this.allowSync) {
      this.status = 404;
      this.body = {
        error: 'not_found',
        reason: 'document not found',
      };
      return;
    }

    // start sync
    const logId = yield SyncModuleWorker.sync(name, 'sync-by-install');
    debug('start sync %s, get log id %s', name, logId);

    return this.redirect(config.officialNpmRegistry + this.url);
  }

  let latestMod = null;
  let readme = null;
  // set tags
  const distTags = {};
  for (const t of tags) {
    distTags[t.tag] = t.version;
  }

  // set versions and times
  const versions = {};
  let times = {};
  const attachments = {};
  let createdTime = null;
  for (const row of rows) {
    const pkg = row.package;
    // pkg is string ... ignore it
    if (typeof pkg === 'string') {
      continue;
    }
    common.setDownloadURL(pkg, this);
    pkg._cnpm_publish_time = row.publish_time;
    pkg.publish_time = pkg.publish_time || row.publish_time;

    versions[pkg.version] = pkg;

    const t = times[pkg.version] = row.publish_time ? new Date(row.publish_time) : row.gmt_modified;
    if ((!distTags.latest && !latestMod) || distTags.latest === pkg.version) {
      latestMod = row;
      readme = pkg.readme;
    }

    delete pkg.readme;
    if (maintainers.length > 0) {
      pkg.maintainers = maintainers;
    }

    if (!createdTime || t < createdTime) {
      createdTime = t;
    }
  }

  if (modifiedTime && createdTime) {
    const ts = {
      modified: modifiedTime,
      created: createdTime,
    };
    for (const t in times) {
      ts[t] = times[t];
    }
    times = ts;
  }

  if (!latestMod) {
    latestMod = rows[0];
  }

  const rev = String(latestMod.id);
  const pkg = latestMod.package;

  if (tags.length === 0) {
    // some sync error reason, will cause tags missing
    // set latest tag at least
    distTags.latest = pkg.version;
  }

  const info = {
    _id: orginalName,
    _rev: rev,
    name: orginalName,
    description: pkg.description,
    'dist-tags': distTags,
    maintainers: pkg.maintainers,
    time: times,
    users: starUsers,
    author: pkg.author,
    repository: pkg.repository,
    versions,
    readme,
    _attachments: attachments,
  };

  info.readmeFilename = pkg.readmeFilename;
  info.homepage = pkg.homepage;
  info.bugs = pkg.bugs;
  info.license = pkg.license;

  debug('show module %s: %s, latest: %s', orginalName, rev, latestMod.version);
  this.jsonp = info;
};
