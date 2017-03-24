'use strict';

var path = require('path');
var config = require('../config');
var sequelize = require('../common/sequelize');

function load(name) {
  return sequelize.import(path.join(__dirname, name));
}

var _ModuleAbbreviated = config.enableAbbreviatedMetadata ? load('module_abbreviated') : null;
var _PackageReadme = config.enableAbbreviatedMetadata ? load('package_readme') : null;

module.exports = {
  sequelize: sequelize,
  Module: load('module'),
  ModuleLog: load('module_log'),
  ModuleStar: load('module_star'),
  ModuleKeyword: load('module_keyword'),
  ModuleDependency: load('module_deps'),
  ModuleMaintainer: load('module_maintainer'),
  ModuleUnpublished: load('module_unpublished'),
  NpmModuleMaintainer: load('npm_module_maintainer'),

  Tag: load('tag'),
  User: load('user'),
  Total: load('total'),
  DownloadTotal: load('download_total'),

  query: function* (sql, args) {
    var options = { replacements: args };
    var data = yield this.sequelize.query(sql, options);
    if (/select /i.test(sql)) {
      return data[0];
    }
    return data[1];
  },
  queryOne: function* (sql, args) {
    var rows = yield this.query(sql, args);
    return rows && rows[0];
  },

  get ModuleAbbreviated() {
    if (!config.enableAbbreviatedMetadata) {
      return null;
    }
    if (!_ModuleAbbreviated) {
      _ModuleAbbreviated = load('module_abbreviated');
    }
    return _ModuleAbbreviated;
  },

  get PackageReadme() {
    if (!config.enableAbbreviatedMetadata) {
      return null;
    }
    if (!_PackageReadme) {
      _PackageReadme = load('package_readme');
    }
    return _PackageReadme;
  },
};
