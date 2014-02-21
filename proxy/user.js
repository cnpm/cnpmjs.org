/**!
 * cnpmjs.org - proxy/user.js
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
var utility = require('utility');
var config = require('../config');
var mysql = require('../common/mysql');
var crypto = require('crypto');

var COLUMNS = 'id, rev, name, email, salt, password_sha, ip, roles, gmt_create, gmt_modified';
var SELECT_USER_SQL = 'SELECT ' + COLUMNS + ' FROM user WHERE name=?;';

function sha1(s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function passwordSha(password, salt) {
  return sha1(password + salt);
}
exports.passwordSha = passwordSha;

exports.get = function (name, callback) {
  mysql.queryOne(SELECT_USER_SQL, [name], function (err, row) {
    if (row) {
      try {
        row.roles = JSON.parse(row.roles);
      } catch (e) {
        row.roles = [];
      }
    }
    callback(err, row);
  });
};

exports.auth = function (name, password, callback) {
  exports.get(name, function (err, row) {
    if (err || !row) {
      return callback(err, row);
    }

    var sha = passwordSha(password, row.salt);
    if (row.password_sha !== sha) {
      row = null;
    }
    callback(null, row);
  });
};

var INSERT_USER_SQL = 'INSERT INTO user(rev, name, email, salt, password_sha, ip, roles, gmt_create, gmt_modified) \
  VALUES(?, ?, ?, ?, ?, ?, ?, now(), now())';

exports.add = function (user, callback) {
  var roles = user.roles || [];
  try {
    roles = JSON.stringify(roles);
  } catch (e) {
    roles = '[]';
  }
  var rev = '1-' + utility.md5(JSON.stringify(user));
  var values = [rev, user.name, user.email, user.salt, user.password_sha, user.ip, roles];
  mysql.query(INSERT_USER_SQL, values, function (err) {
    callback(err, {rev: rev});
  });
};

var UPDATE_USER_SQL = 'UPDATE user SET rev=?, email=?, salt=?, password_sha=?, ip=?, roles=?, gmt_modified=now() \
  WHERE name=? AND rev=?;';

exports.update = function (user, callback) {
  var rev = user.rev || user._rev;
  var revNo = Number(rev.split('-', 1));
  if (!revNo) {
    var err = new Error(rev + ' format error');
    err.name = 'RevFormatError';
    err.data = {user: user};
    return callback(err);
  }
  revNo++;
  var newRev = revNo + '-' + utility.md5(JSON.stringify(user));
  var roles = user.roles || [];
  try {
    roles = JSON.stringify(roles);
  } catch (e) {
    roles = '[]';
  }

  var values = [newRev, user.email, user.salt, user.password_sha, user.ip, roles, user.name, rev];
  mysql.query(UPDATE_USER_SQL, values, function (err, data) {
    if (err || !data.affectedRows) {
      return callback(err);
    }
    callback(null, {rev: newRev});
  });
};

thunkify(exports);
