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
/* jshint -W032 */

/**
 * Module dependencies.
 */

var mysql = require('../common/mysql');
var multiline = require('multiline');

var ADD_SQL = multiline(function () {;/*
  INSERT INTO
    module_star(name, user, gmt_create)
  VALUES
    (?, ?, now());
*/});
exports.add = function *add(name, user) {
  try {
    yield mysql.query(ADD_SQL, [name, user]);
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') {
      throw err;
    }
  }
};

var REMOVE_SQL = multiline(function () {;/*
  DELETE FROM
    module_star
  WHERE
    name = ? AND user = ?;
*/});
exports.remove = function *(name, user) {
  return yield mysql.query(REMOVE_SQL, [name, user]);
};

var LIST_USERS_SQL = multiline(function () {;/*
  SELECT
    user
  FROM
    module_star
  WHERE
    name = ?;
*/});
exports.listUsers = function *(name) {
  var rows = yield mysql.query(LIST_USERS_SQL, [name]);
  return rows.map(function (r) {
    return r.user;
  });
};

var LIST_USER_MODULES_SQL = multiline(function () {;/*
  SELECT
    name
  FROM
    module_star
  WHERE
    user = ?;
*/});
exports.listUserModules = function *(user) {
  return (yield mysql.query(LIST_USER_MODULES_SQL, [user])).map(function (r) {
    return r.name;
  });
};
