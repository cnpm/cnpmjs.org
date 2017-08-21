'use strict';

var debug = require('debug')('cnpmjs.org:controllers:registry:user:update');
var ensurePasswordSalt = require('./common').ensurePasswordSalt;
var userService = require('../../../services/user');

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
module.exports = function* updateUser(next) {
  var name = this.params.name;
  var rev = this.params.rev;
  if (!name || !rev) {
    return yield next;
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

  var result = yield userService.update(user);
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
