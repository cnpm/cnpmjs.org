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

var thunkify = require('thunkify-wrap');
var ready = require('ready');
var sequelize = require('./sequelize');

exports.query = function (sql, values, cb) {
  if (typeof values === 'function') {
    cb = values;
    values = null;
  }
  var ctx = {
    Model: {
      autoIncrementField: 'id'
    }
  };
  sequelize.query(sql, ctx, { raw: true }, values)
    .then(function (rows) {
      // black hack to get back the insertId
      if (!rows && ctx.id) {
        rows = {
          insertId: ctx.id
        };
      }
      cb(null, rows);
    })
    .catch(cb);
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

thunkify(exports);

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
