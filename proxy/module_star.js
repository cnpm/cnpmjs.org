/**!
 * cnpmjs.org - proxy/module_star.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var mysql = require('../common/mysql');

exports.add = function *add(name, user) {
  var sql = 'INSERT INTO module_star(name, user) VALUES(?, ?);';
  try {
    yield mysql.query(sql, [name, user]);
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') {
      throw err;
    }
  }
};

exports.remove = function *(name, user) {
  var sql = 'DELETE FROM module_star WHERE name = ? AND user = ?;';
  return yield mysql.query(sql, [name, user]);
};

exports.listUsers = function *(name) {
  var sql = 'SELECT user FROM module_star WHERE name = ?;';
  var rows = yield mysql.query(sql, [name]);
  return rows.map(function (r) {
    return r.user;
  });
};

exports.listUserModules = function *(user) {
  var sql = 'SELECT name FROM module_star WHERE user = ?;';
  return (yield mysql.query(sql, [user])).map(function (r) {
    return r.name;
  });
};
