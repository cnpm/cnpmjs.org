/**!
 * cnpmjs.org - services/user.js
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

var config = require('../config');
if (!config.userService) {
  var DefaultUserService = require('./default_user_service');
  config.userService = new DefaultUserService();
  config.customUserService = false;
} else {
  config.customUserService = true;
}
config.scopes = config.scopes || [];

function convertUser(user) {
  if (!user) {
    return null;
  }
  user.scopes = user.scopes || [];
  if (user.scopes.length === 0 && config.scopes.length > 0) {
    user.scopes = config.scopes.slice();
  }
  return user;
}

exports.auth = function* (login, password) {
  var user = yield* config.userService.auth(login, password);
  return convertUser(user);
};

exports.get = function* (login) {
  var user = yield* config.userService.get(login);
  return convertUser(user);
};

exports.list = function* (logins) {
  var users = yield* config.userService.list(logins);
  return users.map(convertUser);
};

exports.search = function* (query, options) {
  var users = yield* config.userService.search(query, options);
  return users.map(convertUser);
};
