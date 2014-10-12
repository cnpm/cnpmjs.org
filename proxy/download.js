/**!
 * cnpmjs.org - proxy/download.js
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
var config = require('../config');
var mysql = require('../common/mysql');
var multiline = require('multiline');

var PLUS_SQL = multiline(function () {;/*
  INSERT INTO
    download_total(gmt_create, gmt_modified, date, name, count)
  VALUES
    (now(), now(), ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    count=count + VALUES(count),
    name=VALUES(name),
    date=VALUES(date);
*/});
exports.plusTotal = function (data, callback) {
  mysql.query(PLUS_SQL, [data.date, data.name, data.count], callback);
};

thunkify(exports);
