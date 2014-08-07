/**!
 * cnpmjs.org - controllers/registry/deprecate.js
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

var Module = require('../../proxy/module');

module.exports = deprecateVersions;

/**
 * @see https://github.com/cnpm/cnpmjs.org/issues/415
 */
function* deprecateVersions(next) {
  var body = this.request.body;
  var name = this.params.name || this.params[0];

  var tasks = [];
  for (var version in body.versions) {
    tasks.push(Module.get(name, version));
  }
  var rs = yield tasks;

  var updateTasks = [];
  for (var i = 0; i < rs.length; i++) {
    var row = rs[i];
    if (!row) {
      // some version not exists
      this.status = 400;
      this.body = {
        error: 'version_error',
        reason: 'Some versions: ' + JSON.stringify(Object.keys(body.versions)) + ' not found'
      };
      return;
    }
    var data = body.versions[row.package.version];
    if (data.deprecated) {
      row.package.deprecated = data.deprecated;
      updateTasks.push(Module.updatePackage(row.id, row.package));
    }
  }
  yield updateTasks;

  this.status = 201;
  this.body = {
    ok: true
  };
}
