'use strict';

const packageService = require('../../../services/package');

function ok() {
  return {
    ok: 'dist-tags updated',
  };
}

// GET /-/package/:pkg/dist-tags -- returns the package's dist-tags
exports.index = function* () {
  const name = this.params.name || this.params[0];
  const rows = yield packageService.listModuleTags(name);
  const tags = {};
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    tags[row.tag] = row.version;
  }
  this.body = tags;
};

// PUT /-/package/:pkg/dist-tags -- Set package's dist-tags to provided object body (removing missing)
exports.save = function* () {
  const name = this.params.name || this.params[0];
  yield packageService.removeModuleTags(name);
  yield exports.update.call(this);
};

// POST /-/package/:pkg/dist-tags -- Add/modify dist-tags from provided object body (merge)
exports.update = function* () {
  const name = this.params.name || this.params[0];
  const tags = this.request.body;
  for (const tag in tags) {
    const version = tags[tag];
    yield packageService.addModuleTag(name, tag, version);
  }
  this.status = 201;
  this.body = ok();
};

// PUT /-/package/:pkg/dist-tags/:tag -- Set package's dist-tags[tag] to provided string body
// POST /-/package/:pkg/dist-tags/:tag -- Same as PUT /-/package/:pkg/dist-tags/:tag
exports.set = function* () {
  const name = this.params.name || this.params[0];
  const tag = this.params.tag || this.params[1];
  const version = this.request.body;
  // make sure version exists
  const pkg = yield packageService.getModule(name, version);
  if (!pkg) {
    this.status = 400;
    this.body = {
      error: 'version_error',
      reason: name + '@' + version + ' not exists',
    };
    return;
  }

  yield packageService.addModuleTag(name, tag, version);
  this.status = 201;
  this.body = ok();
};

// DELETE /-/package/:pkg/dist-tags/:tag -- Remove tag from dist-tags
exports.destroy = function* () {
  const name = this.params.name || this.params[0];
  const tag = this.params.tag || this.params[1];
  if (tag === 'latest') {
    this.status = 400;
    this.body = {
      error: 'dist_tag_error',
      reason: 'Can\'t not delete latest tag',
    };
    return;
  }
  yield packageService.removeModuleTagsByNames(name, tag);
  this.body = ok();
};
