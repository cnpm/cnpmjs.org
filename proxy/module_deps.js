/**!
 * cnpmjs.org - proxy/module_deps.js
 *
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var mysql = require('../common/mysql');

var LIST_DEPS_SQL = 'SELECT deps FROM module_deps WHERE name=?;';

exports.list = function (name, callback) {
  mysql.query(LIST_DEPS_SQL, [name], callback);
};

var INSERT_DEPS_SQL = 'INSERT INTO module_deps(gmt_create, name, deps) \
  VALUES(now(), ?, ?);';

exports.add = function (name, deps, callback) {
  mysql.query(INSERT_DEPS_SQL, [name, deps], function (err, result) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      err = null;
    }
    callback(err);
  });
};

var DELETE_DEPS_SQL = 'DELETE FROM module_deps WHERE name=? AND deps=?;';

exports.remove = function (name, deps, callback) {
  mysql.query(DELETE_DEPS_SQL, [name, deps], callback);
};
