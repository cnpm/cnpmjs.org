/**!
 * cnpmjs.org - controllers/registry/user.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:controllers:registry:user');
var utility = require('utility');
var crypto = require('crypto');
var UserService = require('../../services/user');
var User = require('../../proxy/user');
var config = require('../../config');
var common = require('../../lib/common');

exports.show = function* (next) {
  var name = this.params.name;
  var isAdmin = common.isAdmin(name);
  var scopes = config.scopes || [];
  if (config.customUserService) {
    var customUser = yield* UserService.get(name);
    if (customUser) {
      isAdmin = !!customUser.site_admin;
      scopes = customUser.scopes;

      var data = {
        user: customUser
      };
      yield* User.saveCustomUser(data);
    }
  }

  var user = yield* User.get(name);
  if (!user) {
    return yield* next;
  }

  var data = user.json;
  if (!data) {
    data = {
      _id: 'org.couchdb.user:' + user.name,
      _rev: user.rev,
      name: user.name,
      email: user.email,
      type: 'user',
      roles: [],
      date: user.gmt_modified,
    };
  }

  if (data.login) {
    // custom user format
    // convert to npm user format
    data = {
      _id: 'org.couchdb.user:' + user.name,
      _rev: user.rev,
      name: user.name,
      email: user.email,
      type: 'user',
      roles: [],
      date: user.gmt_modified,
      avatar: data.avatar_url,
      fullname: data.name || data.login,
      homepage: data.html_url,
    };
  }

  data._cnpm_meta = {
    id: user.id,
    npm_user: user.npm_user === 1,
    custom_user: user.npm_user === 2,
    gmt_create: user.gmt_create,
    gmt_modified: user.gmt_modified,
    admin: isAdmin,
    scopes: scopes,
  };

  this.body = data;
};

function ensurePasswordSalt(user, body) {
  if (!user.password_sha && body.password) {
    // create password_sha on server
    user.salt = crypto.randomBytes(30).toString('hex');
    user.password_sha = utility.sha1(body.password + user.salt);
  }
}

// npm 1.4.4
// add new user first
// @see https://github.com/npm/npm-registry-client/commit/effb4bc88d443f764f2c2e8b4dd583cc72cf6084
// PUT /-/user/org.couchdb.user:mk2 { accept: 'application/json',
//   'accept-encoding': 'gzip',
//   'user-agent': 'node/v0.11.12 darwin x64',
//   host: '127.0.0.1:7001',
//   'content-type': 'application/json',
//   'content-length': '150',
//   connection: 'close' } { name: 'mk2',
//   password: '123456',
//   email: 'fengmk2@gmail.com',
//   _id: 'org.couchdb.user:mk2',
//   type: 'user',
//   roles: [],
//   date: '2014-03-15T02:33:19.465Z' }

// old npm flow
// json:
// PUT /-/user/org.couchdb.user:mk2 { accept: 'application/json',
//   'user-agent': 'node/v0.8.26 darwin x64',
//   host: '127.0.0.1:7001',
//   'content-type': 'application/json',
//   'content-length': '258',
//   connection: 'keep-alive' }
// { name: 'mk2',
//   salt: '12351936478446a5466d4fb1633b80f3838b4caaa03649a885ac722cd6',
//   password_sha: '123408912a6db1d96b132a90856d99db029cef3d',
//   email: 'fengmk2@gmail.com',
//   _id: 'org.couchdb.user:mk2',
//   type: 'user',
//   roles: [],
//   date: '2014-03-15T02:39:25.696Z' }
exports.add = function* () {
  var name = this.params.name;
  var body = this.request.body || {};
  var user = {
    name: body.name,
    // salt: body.salt,
    // password_sha: body.password_sha,
    email: body.email,
    ip: this.ip || '0.0.0.0',
    // roles: body.roles || [],
  };

  ensurePasswordSalt(user, body);

  if (!body.password || !user.name || !user.salt || !user.password_sha || !user.email) {
    this.status = 422;
    this.body = {
      error: 'paramError',
      reason: 'params missing, name, email or password missing.'
    };
    return;
  }

  debug('add user: %j', body);

  var loginedUser;
  try {
    loginedUser = yield UserService.auth(body.name, body.password);
  } catch (err) {
    this.status = err.status || 500;
    this.body = {
      error: err.name,
      reason: err.message
    };
    return;
  }
  if (loginedUser) {
    var rev = Date.now() + '-' + loginedUser.login;
    if (config.customUserService) {
      // make sure sync user meta to cnpm database
      var data = user;
      data.rev = rev;
      data.user = loginedUser;
      yield* User.saveCustomUser(data);
    }
    this.status = 201;
    this.body = {
      ok: true,
      id: 'org.couchdb.user:' + loginedUser.login,
      rev: rev,
    };
    return;
  }

  if (config.customUserService) {
    // user login fail, not allow to add new user
    this.status = 401;
    this.body = {
      error: 'unauthorized',
      reason: 'Login fail, please check your login name and password'
    };
    return;
  }

  var existUser = yield User.get(name);
  if (existUser) {
    this.status = 409;
    this.body = {
      error: 'conflict',
      reason: 'User ' + name + ' already exists.'
    };
    return;
  }

  var result = yield User.add(user);
  this.etag = '"' + result.rev + '"';
  this.status = 201;
  this.body = {
    ok: true,
    id: 'org.couchdb.user:' + name,
    rev: result.rev
  };
};

// logined before update, no need to auth user again
// { name: 'admin',
// password: '123123',
// email: 'fengmk2@gmail.com',
// _id: 'org.couchdb.user:admin',
// type: 'user',
// roles: [],
// date: '2014-08-05T16:08:22.645Z',
// _rev: '1-1a18c3d73ba42e863523a399ff3304d8',
// _cnpm_meta:
//  { id: 14,
//    npm_user: false,
//    custom_user: false,
//    gmt_create: '2014-08-05T15:46:58.000Z',
//    gmt_modified: '2014-08-05T15:46:58.000Z',
//    admin: true,
//    scopes: [ '@cnpm', '@cnpmtest' ] } }
exports.update = function *(next) {
  var name = this.params.name;
  var rev = this.params.rev;
  if (!name || !rev) {
    return yield* next;
  }
  debug('update: %s, rev: %s, user.name: %s', name, rev, this.user.name);

  if (name !== this.user.name) {
    // must auth user first
    this.status = 401;
    this.body = {
      error: 'unauthorized',
      reason: 'Name is incorrect.'
    };
    return;
  }

  var body = this.request.body || {};
  var user = {
    name: body.name,
    // salt: body.salt,
    // password_sha: body.password_sha,
    email: body.email,
    ip: this.ip || '0.0.0.0',
    rev: body.rev || body._rev,
    // roles: body.roles || [],
  };

  debug('update user %j', body);

  ensurePasswordSalt(user, body);

  if (!body.password || !user.name || !user.salt || !user.password_sha || !user.email) {
    this.status = 422;
    this.body = {
      error: 'paramError',
      reason: 'params missing, name, email or password missing.'
    };
    return;
  }

  var result = yield User.update(user);
  if (!result) {
    this.status = 409;
    this.body = {
      error: 'conflict',
      reason: 'Document update conflict.'
    };
    return;
  }

  this.status = 201;
  this.body = {
    ok: true,
    id: 'org.couchdb.user:' + user.name,
    rev: result.rev
  };
};
