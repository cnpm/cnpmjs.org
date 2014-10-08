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

  var firstUser = users[0];
  if (!firstUser) {
    // params.user = '|'
    this.body = {};
    return;
  }

  var data = {};
  var r = yield [
    NpmModuleMaintainer.listByUsers(users),
    // get the first user module by author field
    Module.listNamesByAuthor(firstUser),
  ];
  var rows = r[0];
  var firstUserModuleNames = r[1];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (data[row.user]) {
      data[row.user].push(row.name);
    } else {
      data[row.user] = [row.name];
    }
  }

  if (firstUserModuleNames.length > 0) {
    if (!data[firstUser]) {
      data[firstUser] = firstUserModuleNames;
    } else {
      var items = data[firstUser];
      for (var i = 0; i < firstUserModuleNames.length; i++) {
        var name = firstUserModuleNames[i];
        if (items.indexOf(name) === -1) {
          items.push(name);
        }
      }
    }
  }

  this.body = data;
};
