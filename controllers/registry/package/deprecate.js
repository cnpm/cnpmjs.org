'use strict';

var packageService = require('../../../services/package');

module.exports = deprecateVersions;

/**
 * @see https://github.com/cnpm/cnpmjs.org/issues/415
 */
function* deprecateVersions() {
  var body = this.request.body;
  var name = this.params.name || this.params[0];

  var tasks = [];
  for (var version in body.versions) {
    tasks.push(packageService.getModule(name, version));
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
