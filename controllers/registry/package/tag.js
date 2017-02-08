'use strict';

const debug = require('debug')('cnpmjs.org:controllers:registry:package:tag');
const semver = require('semver');
const util = require('util');
const packageService = require('../../../services/package');

// PUT /:name/:tag
// https://github.com/npm/npm-registry-client/blob/master/lib/tag.js#L4
// this.request("PUT", uri+"/"+tagName, { body : JSON.stringify(version) }, cb)
module.exports = function* tag() {
  const version = this.request.body;
  const name = this.params.name || this.params[0];
  const tag = this.params.tag || this.params[1];
  debug('tag %j to %s/%s', version, name, tag);

  if (!version) {
    this.status = 400;
    this.body = {
      error: 'version_missed',
      reason: 'version not found',
    };
    return;
  }

  if (!semver.valid(version)) {
    this.status = 403;
    const reason = util.format('setting tag %s to invalid version: %s: %s/%s',
      tag, version, name, tag);
    this.body = {
      error: 'forbidden',
      reason,
    };
    return;
  }

  const mod = yield packageService.getModule(name, version);
  if (!mod) {
    this.status = 403;
    const reason = util.format('setting tag %s to unknown version: %s: %s/%s',
      tag, version, name, tag);
    this.body = {
      error: 'forbidden',
      reason,
    };
    return;
  }

  const row = yield packageService.addModuleTag(name, tag, version);
  this.status = 201;
  this.body = {
    ok: true,
    modified: row.gmt_modified,
  };
};
