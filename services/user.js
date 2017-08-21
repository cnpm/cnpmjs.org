'use strict';

var config = require('../config');
var User = require('../models').User;

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
  var user = yield config.userService.auth(login, password);
  return convertUser(user);
};

exports.get = function* (login) {
  var user = yield config.userService.get(login);
  return convertUser(user);
};

exports.list = function* (logins) {
  var users = yield config.userService.list(logins);
  return users.map(convertUser);
};

exports.search = function* (query, options) {
  var users = yield config.userService.search(query, options);
  return users.map(convertUser);
};

exports.getAndSave = function* (login) {
  if (config.customUserService) {
    var user = yield exports.get(login);
    if (user) {
      var data = {
        user: user
      };
      yield User.saveCustomUser(data);
    }
  }
  return yield User.findByName(login);
};

exports.authAndSave = function* (login, password) {
  var user = yield exports.auth(login, password);
  if (user) {
    if (config.customUserService) {
      // make sure sync user meta to cnpm database
      var data = {
        rev: Date.now() + '-' + user.login,
        user: user
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
