'use strict';

const packageService = require('../../../services/package');
const config = require('../../../config');

// GET /-/short
// List public all packages names only
module.exports = function* () {
  if (this.query.private_only) {
    const tasks = [];
    for (let i = 0; i < config.scopes.length; i++) {
      const scope = config.scopes[i];
      tasks.push(packageService.listPrivateModulesByScope(scope));
    }

    if (config.privatePackages && config.privatePackages.length > 0) {
      tasks.push(packageService.listModules(config.privatePackages));
    }

    const results = yield tasks;
    const names = [];
    for (const rows of results) {
      for (const row of rows) {
        names.push(row.name);
      }
    }
    this.body = names;
    return;
  }

  this.body = yield packageService.listAllPublicModuleNames();
};
