/*!
 * cnpmjs.org - common/mysql.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var ready = require('ready');
var mysql = require('mysql');
var config = require('../config');

var server = config.mysqlServers[0];

// TODO: query timeout
var pool = mysql.createPool({
  host: server.host,
  port: server.port,
  user: server.user,
  password: server.password,
  database: config.mysqlDatabase,
  connectionLimit: config.mysqlMaxConnections,
  multipleStatements: true,
});

exports.pool = pool;

exports.query = function (sql, values, cb) {
  pool.query(sql, values, function (err, rows) {
    cb(err, rows);
  });
};

exports.queryOne = function (sql, values, cb) {
  if (typeof values === 'function') {
    cb = values;
    values = null;
  }
  exports.query(sql, values, function (err, rows) {
    if (rows) {
      rows = rows[0];
    }
    cb(err, rows);
  });
};

exports.escape = function (val) {
  return pool.escape(val);
};

ready(exports);

function init() {
  exports.query('show tables', function (err, rows) {
    if (err) {
      console.error('[%s] [worker:%s] mysql init error: %s', Date(), process.pid, err);
      setTimeout(init, 1000);
      return;
    }
    console.log('[%s] [worker:%s] mysql ready, got %d tables', Date(), process.pid, rows.length);
    exports.ready(true);
  });
}
init();
