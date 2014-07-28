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

exports.auth = function* (login, password) {
  return yield* config.userService.auth(login, password);
};

exports.get = function* (login) {
  return yield* config.userService.get(login);
};

exports.list = function* (logins) {
  return yield* config.userService.list(logins);
};

exports.search = function* (query, options) {
  return yield* config.userService.search(query, options);
};
