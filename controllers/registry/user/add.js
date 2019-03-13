'use strict';

var ensurePasswordSalt = require('./common').ensurePasswordSalt;
var userService = require('../../../services/user');
var config = require('../../../config');

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
module.exports = function* addUser() {
  var name = this.params.name;
  var body = this.request.body || {};

  if (!body.password || !body.name) {
    this.status = 422;
    const error = '[param_error] params missing, name, email or password missing';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  var loginedUser;
  try {
    loginedUser = yield userService.authAndSave(body.name, body.password);
  } catch (err) {
    this.status = err.status || 500;
    this.body = {
      error: err.message,
      reason: err.message,
    };
    return;
  }
  if (loginedUser) {
    this.status = 201;
    this.body = {
      ok: true,
      id: 'org.couchdb.user:' + loginedUser.login,
      rev: Date.now() + '-' + loginedUser.login
    };
    return;
  }

  if (config.customUserService) {
    // user login fail, not allow to add new user
    this.status = 401;
    const error = '[unauthorized] Login fail, please check your login name and password';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  var user = {
    name: body.name,
    // salt: body.salt,
    // password_sha: body.password_sha,
    email: body.email,
    ip: this.ip || '0.0.0.0',
    // roles: body.roles || [],
  };

  ensurePasswordSalt(user, body);

  if (!user.salt || !user.password_sha || !user.email) {
    this.status = 422;
    const error = '[param_error] params missing, name, email or password missing';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  var existUser = yield userService.get(name);
  if (existUser) {
    this.status = 409;
    const error = '[conflict] User ' + name + ' already exists';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  // add new user
  var result = yield userService.add(user);
  this.etag = '"' + result.rev + '"';
  this.status = 201;
  this.body = {
    ok: true,
    id: 'org.couchdb.user:' + name,
    rev: result.rev
  };
};
