/**!
 * cnpmjs.org - controllers/registry/package/deprecate.js
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

const packageService = require('../../../services/package');

module.exports = deprecateVersions;

/**
 * @see https://github.com/cnpm/cnpmjs.org/issues/415
 */
function* deprecateVersions() {
  const body = this.request.body;
  const name = this.params.name || this.params[0];

  const tasks = [];
  for (const version in body.versions) {
    tasks.push(packageService.getModule(name, version));
  }
  const rs = yield tasks;

  const updateTasks = [];
  for (let i = 0; i < rs.length; i++) {
    const row = rs[i];
    if (!row) {
      // some version not exists
      this.status = 400;
      this.body = {
        error: 'version_error',
        reason: 'Some versions: ' + JSON.stringify(Object.keys(body.versions)) + ' not found',
      };
      return;
    }
    const data = body.versions[row.package.version];
    if (typeof data.deprecated === 'string') {
      row.package.deprecated = data.deprecated;
      updateTasks.push(packageService.updateModulePackage(row.id, row.package));
    }
  }
  yield updateTasks;
  // update last modified
  yield packageService.updateModuleLastModified(name);

  this.status = 201;
  this.body = {
    ok: true,
  };
}
