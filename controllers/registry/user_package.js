/**!
 * cnpmjs.org - controllers/registry/user_package.js
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

var Module = require('../../proxy/module');
var NpmModuleMaintainer = require('../../proxy/npm_module_maintainer');

exports.list = function* () {
  var users = this.params.user.split('|');
  if (users.length > 20) {
    this.status = 400;
    this.body = {
      error: 'bad_request',
      reason: 'reach max user names limit, must <= 20 user names'
    };
    return;
  }

  var data = {};
  var rows = yield* NpmModuleMaintainer.listByUsers(users);
  if (rows.length > 0) {
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (data[row.user]) {
        data[row.user].push(row.name);
      } else {
        data[row.user] = [row.name];
      }
    }
  } else {
    if (users.length === 1) {
      // try to get from module author
      var names = Module.listNamesByAuthor(users[0]);
      if (names.length > 0) {
        data[users[0]] = names;
      }
    }
  }

  this.body = data;
};
