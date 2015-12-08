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

var packageService = require('../../services/package');

// GET /-/by-user/:user
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

  var tasks = {};
  for (var i = 0; i < users.length; i++) {
    var username = users[i];
    tasks[username] = packageService.listPublicModuleNamesByUser(username);
  }

  var data = yield tasks;

  var keys = Object.keys(data);
  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    // make empty object as undefined
    if (data[key].length === 0) {
      data[key] = undefined;
    }
  }

  this.body = data;
};
