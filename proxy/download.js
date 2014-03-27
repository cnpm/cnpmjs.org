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

var SELECT_ONE_TOTAL_SQL = multiline(function () {;/*
  SELECT
    date, count
  FROM
    download_total
  WHERE
    date>=? AND date<=? AND name=?;
*/});
exports.getModuleTotal = function (name, start, end, callback) {
  mysql.query(SELECT_ONE_TOTAL_SQL, [start, end, name], callback);
};

var SELECT_ALL_TOTAL_SQL = multiline(function () {;/*
  SELECT
    date, sum(count) AS count
  FROM
    download_total
  WHERE
    date>=? AND date<=?
  GROUP BY
    date;
*/});
exports.getTotal = function (start, end, callback) {
  mysql.query(SELECT_ALL_TOTAL_SQL, [start, end], callback);
};

thunkify(exports);
