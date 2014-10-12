/**!
 * cnpmjs.org - models/index.js
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

var path = require('path');
var sequelize = require('../common/sequelize');

function load(name) {
  return sequelize.import(path.join(__dirname, name));
}

var models = module.exports = {
  sequelize: sequelize,
  Module: load('module'),
  User: load('user'),
  Total: load('total'),
  Download: load('download_total'),

  query: function* (sql, args) {
    return yield this.sequelize.query(sql, null, {raw: true}, args);
  },
  queryOne: function* (sql, args) {
    var rows = yield* this.query(sql, args);
    return rows && rows[0];
  }
};
