/**!
 * cnpmjs.org - proxy/dist.js
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
var multiline = require('multiline');

var SAVE_FILE_SQL = multiline(function () {;/*
  INSERT INTO
    dist_file(gmt_create, gmt_modified, name, parent, date, size, url, sha1)
  VALUES
    (now(), now(), ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    name=VALUES(name),
    parent=VALUES(parent),
    date=VALUES(date),
    size=VALUES(size),
    url=VALUES(url),
    sha1=VALUES(sha1);
*/});

exports.savefile = function* (info) {
  return yield mysql.query(SAVE_FILE_SQL, [
    info.name, info.parent, info.date, info.size, info.url, info.sha1
  ]);
};

var SAVE_DIR_SQL = multiline(function () {;/*
  INSERT INTO
    dist_dir(gmt_create, gmt_modified, name, parent, date)
  VALUES
    (now(), now(), ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    name=VALUES(name),
    parent=VALUES(parent),
    date=VALUES(date);
*/});

exports.savedir = function* (info) {
  return yield mysql.query(SAVE_DIR_SQL, [
    info.name, info.parent, info.date, info.size, info.url, info.sha1
  ]);
};

var LIST_DIRS_SQL = multiline(function () {;/*
  SELECT name, parent, date FROM dist_dir WHERE parent = ?;
*/});
var LIST_FILES_SQL = multiline(function () {;/*
  SELECT name, parent, date, size, url, sha1
  FROM dist_file WHERE parent = ?;
*/});

exports.listdir = function* (name) {
  var rs = yield [
    mysql.query(LIST_DIRS_SQL, [name]),
    mysql.query(LIST_FILES_SQL, [name]),
  ];
  return rs[0].concat(rs[1]);
};
