'use strict';
var config = require('../../config');
var npmService = require('../../services/npm');

module.exports = function* showScopeSync () {
  var scope = this.params.scope;
  var scopeConfig = (config.syncScopeConfig || []).find(function (item) {
    return item.scope === scope
  })

  if (!scopeConfig) {
    return this.redirect('/');
  }

  var packages = yield npmService.getScopePackagesShort(scope, scopeConfig.sourceCnpmWeb)

  yield this.render('scope_sync', {
    packages: packages,
    scope: scopeConfig.scope,
    sourceCnpmRegistry: scopeConfig.sourceCnpmRegistry,
    title: 'Sync Scope Packages',
  });
};
