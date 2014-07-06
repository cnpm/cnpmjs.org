/**!
 * cnpmjs.org - proxy/module_maintainer.js
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

var debug = require('debug')('cnpmjs.org:proxy:module_maintainer');
var mysql = require('../common/mysql');
var Module = require('./module');

var GET_MAINTANINERS_SQL = 'SELECT user FROM module_maintainer WHERE name = ?;';

exports.get = function* (name) {
  var users = yield mysql.query(GET_MAINTANINERS_SQL, [name]);
  // if not found maintainers, try to get from latest module package info
  if (users.length === 0) {
    var latestMod = yield Module.getLatest(name);
    var maintainers = latestMod && latestMod.package && latestMod.package.maintainers;
    if (maintainers && maintainers.length > 0) {
      users = maintainers;
    }
  }
  return users.map(function (row) {
    return row.user;
  });
};

var ADD_SQL = 'INSERT INTO module_maintainer(name, user, gmt_create) \
  VALUES (?, ?, now());';
function* add(name, username) {
  try {
    yield mysql.query(ADD_SQL, [name, username]);
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') {
      throw err;
    }
  }
}

var REMOVE_SQL = 'DELETE FROM module_maintainer WHERE name = ? AND user IN (?);';
function* remove(name, usernames) {
  return yield mysql.query(REMOVE_SQL, [name, usernames]);
}

exports.update = function* (name, maintainers) {
  // maintainers should be [name1, name2, ...] format
  // find out the exists maintainers then remove the deletes and add the left
  if (maintainers.length === 0) {
    return {
      add: [],
      remove: []
    };
  }
  var exists = yield* exports.get(name);
  var addUsers = maintainers;
  var removeUsers = [];
  if (exists.length > 0) {
    for (var i = 0; i < exists.length; i++) {
      var username = exists[i];
      if (addUsers.indexOf(username) === -1) {
        removeUsers.push(username);
      }
    }
  }
  var tasks = [];
  for (var i = 0; i < addUsers.length; i++) {
    tasks.push(add(name, addUsers[i]));
  }
  yield tasks;
  // make sure all add users success then remove users
  if (removeUsers.length > 0) {
    yield* remove(name, removeUsers);
  }
  debug('add %d users, remove %d users', addUsers.length, removeUsers.length);
  return {
    add: addUsers,
    remove: removeUsers
  };
};
