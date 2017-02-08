/**!
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

const path = require('path');
const sequelize = require('../common/sequelize');

function load(name) {
  return sequelize.import(path.join(__dirname, name));
}

module.exports = {
  sequelize,
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

  * query(sql, args) {
    const options = { replacements: args };
    const data = yield this.sequelize.query(sql, options);
    if (/select /i.test(sql)) {
      return data[0];
    }
    return data[1];
  },
  * queryOne(sql, args) {
    const rows = yield this.query(sql, args);
    return rows && rows[0];
  },
};
