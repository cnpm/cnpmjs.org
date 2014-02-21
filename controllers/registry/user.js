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
var logger = require('../../common/logger');
var User = require('../../proxy/user');

exports.show = function *(next) {
  var name = this.params.name;
  var user = yield User.get(name);
  if (!user) {
    return yield next;
  }
  this.etag = '"' + user.rev + '"';
  var data = {
    _id: 'org.couchdb.user:' + user.name,
    _rev: user.rev,
    name: user.name,
    email: user.email,
    type: 'user',
    roles: [],
    date: user.gmt_modified,
  };
  this.body = data;
};

// json:
//  { name: 'fengmk2',
//    salt: 'xxxx',
//    password_sha: 'xxxxxx',
//    email: 'fengmk2@gmail.com',
//    _id: 'org.couchdb.user:fengmk2',
//    type: 'user',
//    roles: [],
//    date: '2013-12-04T12:56:13.714Z' } }
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

  if (!user.name || !user.salt || !user.password_sha || !user.email) {
    this.status = 422;
    this.body = {
      error: 'paramError',
      reason: 'params missing'
    };
    return;
  }
  debug('add user: %j', user);

  var existUser = yield User.get(name);
  if (existUser) {
    this.status = 409;
    this.body = {
      error: 'conflict',
      reason: 'Document update conflict.'
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

  this.session.name = user.name;
  this.body = {ok: true, name: user.name, roles: []};
};

exports.update = function *(next) {
  var name = this.params.name;
  var rev = this.params.rev;
  if (!name || !rev) {
    return yield next;
  }

  debug('update: %s, rev: %s, session.name: %s', name, rev, this.session.name);

  if (name !== this.session.name) {
    // must authSession first
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
