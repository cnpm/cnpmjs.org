/**!
 * cnpmjs.org - proxy/module_log.js
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

var thunkify = require('thunkify-wrap');
var mysql = require('../common/mysql');

var INSERT_LOG_SQL = 'INSERT INTO module_log SET ?';
exports.create = function (data, callback) {
  var now = new Date();
  var args = {
    gmt_create: now,
    gmt_modified: now,
    name: data.name,
    username: data.username,
    log: ''
  };
  mysql.query(INSERT_LOG_SQL, [args], function (err, result) {
    if (err) {
      return callback(err);
    }
    callback(null, {id: result.insertId, gmt_modified: new Date()});
  });
};

var APPEND_SQL = 'UPDATE module_log SET log=CONCAT(log, ?), gmt_modified=now() WHERE id=?';
exports.append = function (id, log, callback) {
  log = '\n' + log;
  mysql.query(APPEND_SQL, [log, id], function (err) {
    callback(null, {id: id, gmt_modified: new Date()});
  });
};

var SELECT_SQL = 'SELECT * FROM module_log WHERE id=?';
exports.get = function (id, callback) {
  mysql.queryOne(SELECT_SQL, [id], callback);
};

thunkify(exports);
