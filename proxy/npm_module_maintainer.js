/**!
 * cnpmjs.org - proxy/npm_module_maintainer.js
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

var mysql = require('../common/mysql');

exports.add = function* (name, username) {
  var sql = 'INSERT INTO npm_module_maintainer(name, user, gmt_create) \
    VALUES (?, ?, now());';
  try {
    yield mysql.query(sql, [name, username]);
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') {
      throw err;
    }
  }
};

exports.remove = function* (name, username) {
  var sql = 'DELETE FROM npm_module_maintainer WHERE name = ? AND user = ?;';
  return yield mysql.query(sql, [name, username]);
};

exports.removeAll = function* (name) {
  var sql = 'DELETE FROM npm_module_maintainer WHERE name = ?;';
  return yield mysql.query(sql, [name]);
};

exports.list = function* (name) {
  var sql = 'SELECT user FROM npm_module_maintainer WHERE name = ?;';
  return yield mysql.query(sql, [name]);
};

exports.listByUsers = function* (users) {
  var sql = 'SELECT name, user FROM npm_module_maintainer WHERE user = ?;';
  var args = users;
  if (users.length > 1) {
    sql = 'SELECT name, user FROM npm_module_maintainer WHERE user in (?);';
    args = [users];
  }
  return yield mysql.query(sql, args);
};
