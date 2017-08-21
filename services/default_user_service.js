'use strict';

var gravatar = require('gravatar');
// var User = require('../proxy/user');
var User = require('../models').User;
var isAdmin = require('../lib/common').isAdmin;
var config = require('../config');

// User: https://github.com/cnpm/cnpmjs.org/wiki/Use-Your-Own-User-Authorization#user-data-structure
// {
//   "login": "fengmk2",
//   "email": "fengmk2@gmail.com",
//   "name": "Yuan Feng",
//   "html_url": "http://fengmk2.github.com",
//   "avatar_url": "https://avatars3.githubusercontent.com/u/156269?s=460",
//   "im_url": "",
//   "site_admin": false,
//   "scopes": ["@org1", "@org2"]
// }

module.exports = DefaultUserService;

function convertToUser(row) {
  var user = {
    login: row.name,
    email: row.email,
    name: row.name,
    html_url: 'http://cnpmjs.org/~' + row.name,
    avatar_url: '',
    im_url: '',
    site_admin: isAdmin(row.name),
    scopes: config.scopes,
  };
  if (row.json) {
    var data = row.json;
    if (data.login) {
      // custom user
      user = data;
    } else {
      // npm user
      if (data.avatar) {
        user.avatar_url = data.avatar;
      }
      if (data.fullname) {
        user.name = data.fullname;
      }
      if (data.homepage) {
        user.html_url = data.homepage;
      }
      if (data.twitter) {
        user.im_url = 'https://twitter.com/' + data.twitter;
      }
    }
  }
  if (!user.avatar_url) {
    user.avatar_url = gravatar.url(user.email, {s: '50', d: 'retro'}, true);
  }
  return user;
}

function DefaultUserService() {}

var proto = DefaultUserService.prototype;

/**
 * Auth user with login name and password
 * @param  {String} login    login name
 * @param  {String} password login password
 * @return {User}
 */
proto.auth = function* (login, password) {
  var row = yield User.auth(login, password);
  if (!row) {
    return null;
  }
  return convertToUser(row);
};

/**
 * Get user by login name
 * @param  {String} login  login name
 * @return {User}
 */
proto.get = function* (login) {
  var row = yield User.findByName(login);
  if (!row) {
    return null;
  }
  return convertToUser(row);
};

/**
 * List users
 * @param  {Array<String>} logins  login names
 * @return {Array<User>}
 */
proto.list = function* (logins) {
  var rows = yield User.listByNames(logins);
  var users = [];
  rows.forEach(function (row) {
    users.push(convertToUser(row));
  });
  return users;
};

/**
 * Search users
 * @param  {String} query  query keyword
 * @param  {Object} [options] optional query params
 *  - {Number} limit match users count, default is `20`
 * @return {Array<User>}
 */
proto.search = function* (query, options) {
  options = options || {};
  options.limit = parseInt(options.limit);
  if (!options.limit || options.limit < 0) {
    options.limit = 20;
  }

  var rows = yield User.search(query, options);
  var users = [];
  rows.forEach(function (row) {
    users.push(convertToUser(row));
  });
  return users;
};
