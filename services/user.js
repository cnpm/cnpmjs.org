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

const config = require('../config');
const User = require('../models').User;

if (!config.userService) {
  const DefaultUserService = require('./default_user_service');
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
  const user = yield config.userService.auth(login, password);
  return convertUser(user);
};

exports.get = function* (login) {
  const user = yield config.userService.get(login);
  return convertUser(user);
};

exports.list = function* (logins) {
  const users = yield config.userService.list(logins);
  return users.map(convertUser);
};

exports.search = function* (query, options) {
  const users = yield config.userService.search(query, options);
  return users.map(convertUser);
};

exports.getAndSave = function* (login) {
  if (config.customUserService) {
    const user = yield exports.get(login);
    if (user) {
      const data = {
        user,
      };
      yield User.saveCustomUser(data);
    }
  }
  return yield User.findByName(login);
};

exports.authAndSave = function* (login, password) {
  const user = yield exports.auth(login, password);
  if (user) {
    if (config.customUserService) {
      // make sure sync user meta to cnpm database
      const data = {
        rev: Date.now() + '-' + user.login,
        user,
      };
      yield User.saveCustomUser(data);
    }
  }
  return user;
};

exports.add = function* (user) {
  return yield User.add(user);
};

exports.update = function* (user) {
  return yield User.update(user);
};
