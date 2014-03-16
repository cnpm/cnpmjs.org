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

var debug = require('debug')('cnpmjs.org:controllers:registry');
var utility = require('utility');
var crypto = require('crypto');
var User = require('../../proxy/user');
var config = require('../../config');

exports.show = function *(next) {
  var name = this.params.name;
  var user = yield User.get(name);
  if (!user) {
    return yield *next;
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
  data._cnpm_meta = {
    id: user.id,
    npm_user: user.npm_user,
    gmt_create: user.gmt_create,
    gmt_modified: user.gmt_modified,
    admin: !!config.admins[user.name],
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
//   salt: '18d8d51936478446a5466d4fb1633b80f3838b4caaa03649a885ac722cd6',
//   password_sha: '8f4408912a6db1d96b132a90856d99db029cef3d',
//   email: 'fengmk2@gmail.com',
//   _id: 'org.couchdb.user:mk2',
//   type: 'user',
//   roles: [],
//   date: '2014-03-15T02:39:25.696Z' }
exports.add = function *() {
  var name = this.params.name;
  var body = this.request.body || {};
  var user = {
    name: body.name,
    salt: body.salt,
    password_sha: body.password_sha,
    email: body.email,
    ip: this.ip || '0.0.0.0',
    // roles: body.roles || [],
  };

  ensurePasswordSalt(user, body);

  if (!user.name || !user.salt || !user.password_sha || !user.email) {
    this.status = 422;
    this.body = {
      error: 'paramError',
      reason: 'params missing, name, email or password missing.'
    };
    return;
  }
  debug('add user: %j', user);

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

exports.authSession = function *() {
  // body: {"name":"foo","password":"****"}
  var body = this.request.body || {};
  var name = body.name;
  var password = body.password;
  var user = yield User.auth(name, password);
  debug('authSession %s: %j', name, user);

  if (!user) {
    this.status = 401;
    this.body = {ok: false, name: null, roles: []};
    return;
  }
  var session = yield *this.session;
  session.name = user.name;
  this.body = {ok: true, name: user.name, roles: []};
};

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
    salt: body.salt,
    password_sha: body.password_sha,
    email: body.email,
    ip: this.ip || '0.0.0.0',
    rev: body.rev || body._rev,
    // roles: body.roles || [],
  };

  ensurePasswordSalt(user, body);

  if (!user.name || !user.salt || !user.password_sha || !user.email) {
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
