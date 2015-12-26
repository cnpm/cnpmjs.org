/**!
 * cnpmjs.org - middleware/auth.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  Yuwei Ba <xiaobayuwei@gmail.com>
 */

'use strict';


const UserService = require('../services/user');


function* unauthorized(next) {
  this.status = 401;
  this.set('WWW-Authenticate', 'Basic realm="sample"');
  this.body = 'please login';
}


function require_level(level) {
  return function* access_level(next) {
    this.user = {};
    let authorization = (this.get('authorization') || '').split(' ')[1] || '';
    authorization = authorization.trim();
    if (!authorization) {
      return yield* unauthorized.call(this, next);
    }

    authorization = new Buffer(authorization, 'base64').toString().split(':');
    if (authorization.length !== 2) {
      return yield* unauthorized.call(this,next);
    }

    let username = authorization[0];
    let password = authorization[1];
    let row = null;

    try {
      row = yield* UserService.auth(username, password);
    } catch (err) {
      this.user.error = err;
    }
    if (!row) {
      return yield* unauthorized.call(this, next);
    }
    this.user.name = row.login;
    this.user.isAdmin = row.site_admin;
    this.user.role = row.role;

    if (this.user.role >= level || this.user.id === 0) {
      yield *next;
    } else {
      return yield* unauthorized.call(this, next);
    }
  }
}

exports.require_admin = require_level(1);
