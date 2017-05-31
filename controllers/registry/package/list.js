'use strict';

var debug = require('debug')('cnpmjs.org:controllers:registry:package:list');
var packageService = require('../../../services/package');
var common = require('../../../lib/common');
var SyncModuleWorker = require('../../sync_module_worker');
var config = require('../../../config');

/**
 * list all version of a module
 * GET /:name
 */
module.exports = function* list() {
  var name = this.params.name || this.params[0];
  var rs = yield [
    packageService.getModuleLastModified(name),
    packageService.listModuleTags(name),
  ];
  var modifiedTime = rs[0];
  var tags = rs[1];

  debug('show %s, last modified: %s, tags: %j', name, modifiedTime, tags);
  if (modifiedTime) {
    // find out the latest modfied time
    // because update tags only modfied tag, wont change module gmt_modified
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
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

  var abbreviatedMetaType = 'application/vnd.npm.install-v1+json';
  if (config.enableAbbreviatedMetadata && this.accepts([ 'json', abbreviatedMetaType ]) === abbreviatedMetaType) {
    var rows = yield packageService.listModuleAbbreviatedsByName(name);
    if (rows.length > 0) {
      yield handleAbbreviatedMetaRequest(this, name, modifiedTime, tags, rows);
      return;
    }
    var fullRows = yield packageService.listModulesByName(name);
    if (fullRows.length > 0) {
      // no abbreviated meta rows, use the full meta convert to abbreviated meta
      yield handleAbbreviatedMetaRequestWithFullMeta(this, name, modifiedTime, tags, fullRows);
      return;
    }
  }

  var r = yield [
    packageService.listModulesByName(name),
    packageService.listStarUserNames(name),
    packageService.listMaintainers(name),
  ];
  var rows = r[0];
  var starUsers = r[1];
  var maintainers = r[2];

  debug('show %s got %d rows, %d tags, %d star users, maintainers: %j',
    name, rows.length, tags.length, starUsers.length, maintainers);

  var starUserMap = {};
  for (var i = 0; i < starUsers.length; i++) {
    var starUser = starUsers[i];
    if (starUser[0] !== '"' && starUser[0] !== "'") {
      starUserMap[starUser] = true;
    }
  }
  starUsers = starUserMap;

  if (rows.length === 0) {
    // check if unpublished
    var unpublishedInfo = yield packageService.getUnpublishedModule(name);
    debug('show unpublished %j', unpublishedInfo);
    if (unpublishedInfo) {
      this.status = 404;
      this.jsonp = {
        _id: name,
        name: name,
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
      this.jsonp = {
        error: 'not_found',
        reason: 'document not found',
      };
      return;
    }

    // start sync
    var logId = yield SyncModuleWorker.sync(name, 'sync-by-install');
    debug('start sync %s, get log id %s', name, logId);

    return this.redirect(config.officialNpmRegistry + this.url);
  }

  var latestMod = null;
  var readme = null;
  // set tags
  var distTags = {};
  for (var i = 0; i < tags.length; i++) {
    var t = tags[i];
    distTags[t.tag] = t.version;
  }

  // set versions and times
  var versions = {};
  var times = {};
  var attachments = {};
  var createdTime = null;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var pkg = row.package;
    // pkg is string ... ignore it
    if (typeof pkg === 'string') {
      continue;
    }
    common.setDownloadURL(pkg, this);
    pkg._cnpm_publish_time = row.publish_time;
    pkg.publish_time = pkg.publish_time || row.publish_time;

    versions[pkg.version] = pkg;

    var t = times[pkg.version] = row.publish_time ? new Date(row.publish_time) : row.gmt_modified;
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
    var ts = {
      modified: modifiedTime,
      created: createdTime,
    };
    for (var t in times) {
      ts[t] = times[t];
    }
    times = ts;
  }

  if (!latestMod) {
    latestMod = rows[0];
  }

  var rev = String(latestMod.id);
  var pkg = latestMod.package;

  if (tags.length === 0) {
    // some sync error reason, will cause tags missing
    // set latest tag at least
    distTags.latest = pkg.version;
  }

  if (!readme && config.enableAbbreviatedMetadata) {
    var packageReadme = yield packageService.getPackageReadme(name);
    if (packageReadme) {
      readme = packageReadme.readme;
    }
  }

  var info = {
    _id: name,
    _rev: rev,
    name: name,
    description: pkg.description,
    'dist-tags': distTags,
    maintainers: pkg.maintainers,
    time: times,
    users: starUsers,
    author: pkg.author,
    repository: pkg.repository,
    versions: versions,
    readme: readme,
    _attachments: attachments,
  };

  info.readmeFilename = pkg.readmeFilename;
  info.homepage = pkg.homepage;
  info.bugs = pkg.bugs;
  info.license = pkg.license;

  debug('show module %s: %s, latest: %s', name, rev, latestMod.version);
  this.jsonp = info;
};

function* handleAbbreviatedMetaRequest(ctx, name, modifiedTime, tags, rows) {
  debug('show %s got %d rows, %d tags, modifiedTime: %s', name, rows.length, tags.length, modifiedTime);
  var latestMod = null;
  // set tags
  var distTags = {};
  for (var i = 0; i < tags.length; i++) {
    var t = tags[i];
    distTags[t.tag] = t.version;
  }

  // set versions and times
  var versions = {};
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var pkg = row.package;
    common.setDownloadURL(pkg, ctx);
    pkg._publish_on_cnpm = undefined;
    pkg.publish_time = pkg.publish_time || row.publish_time;

    versions[pkg.version] = pkg;

    if ((!distTags.latest && !latestMod) || distTags.latest === pkg.version) {
      latestMod = row;
    }
  }

  if (!latestMod) {
    latestMod = rows[0];
  }

  if (tags.length === 0) {
    // some sync error reason, will cause tags missing
    // set latest tag at least
    distTags.latest = latestMod.package.version;
  }

  var info = {
    name: name,
    modified: modifiedTime,
    'dist-tags': distTags,
    versions: versions,
  };

  debug('show %j', info);
  ctx.jsonp = info;
}

function* handleAbbreviatedMetaRequestWithFullMeta(ctx, name, modifiedTime, tags, rows) {
  debug('show %s got %d rows, %d tags',
    name, rows.length, tags.length);
  var latestMod = null;
  // set tags
  var distTags = {};
  for (var i = 0; i < tags.length; i++) {
    var t = tags[i];
    distTags[t.tag] = t.version;
  }

  // set versions and times
  var versions = {};
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    // pkg is string ... ignore it
    if (typeof row.package === 'string') {
      continue;
    }
    // https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md#abbreviated-version-object
    var pkg = {
      name: row.package.name,
      version: row.package.version,
      deprecated: row.package.deprecated,
      dependencies: row.package.dependencies,
      optionalDependencies: row.package.optionalDependencies,
      devDependencies: row.package.devDependencies,
      bundleDependencies: row.package.bundleDependencies,
      peerDependencies: row.package.peerDependencies,
      bin: row.package.bin,
      directories: row.package.directories,
      dist: row.package.dist,
      engines: row.package.engines,
      _hasShrinkwrap: row.package._hasShrinkwrap,
      publish_time: row.package.publish_time || row.publish_time,
    };
    common.setDownloadURL(pkg, ctx);

    versions[pkg.version] = pkg;

    if ((!distTags.latest && !latestMod) || distTags.latest === pkg.version) {
      latestMod = row;
    }
  }

  if (!latestMod) {
    latestMod = rows[0];
  }

  if (tags.length === 0) {
    // some sync error reason, will cause tags missing
    // set latest tag at least
    distTags.latest = latestMod.package.version;
  }

  var info = {
    name: name,
    modified: modifiedTime,
    'dist-tags': distTags,
    versions: versions,
  };

  debug('show %j', info);
  ctx.jsonp = info;
}
