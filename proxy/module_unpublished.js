/**!
 * cnpmjs.org - proxy/module_unpublished.js
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

var multiline = require('multiline');
var mysql = require('../common/mysql');

var SAVE_SQL = multiline(function () {;/*
  INSERT INTO
    module_unpublished(gmt_create, gmt_modified, name, package)
  VALUES
    (now(), now(), ?, ?)
  ON DUPLICATE KEY UPDATE
    gmt_modified=now(),
    name=VALUES(name),
    package=VALUES(package);
*/});

exports.add = function* (name, pkg) {
  return yield mysql.query(SAVE_SQL, [name, JSON.stringify(pkg)]);
};

var GET_SQL = 'SELECT gmt_modified, name, package FROM module_unpublished WHERE name=?;';

exports.get = function* (name) {
  var row = yield mysql.queryOne(GET_SQL, [name]);
  if (row) {
    row.package = JSON.parse(row.package);
  }
  return row;
};
