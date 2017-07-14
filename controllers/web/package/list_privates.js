'use strict';

var packageService = require('../../../services/package');
var config = require('../../../config');

module.exports = function* listPrivates() {
  var tasks = {};
  for (var i = 0; i < config.scopes.length; i++) {
    var scope = config.scopes[i];
    tasks[scope] = packageService.listPrivateModulesByScope(scope);
  }

  if (config.privatePackages && config.privatePackages.length > 0) {
    tasks['no scoped'] = packageService.listModules(config.privatePackages);
  }

  var scopes = yield tasks;
  yield this.render('private', {
    title: 'private packages',
    scopes: scopes
  });
};
