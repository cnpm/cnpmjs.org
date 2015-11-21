/**!
 * cnpmjs.org - middleware/auth.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:middleware:auth');
var UserService = require('../services/user');
var config = require('../config');

/**
 * Parse the request authorization
 * get the real user
 */

module.exports = function () {
  return function* auth(next) {
    this.user = {};
    var authorization = (this.get('authorization') || '').split(' ')[1] || '';
    authorization = authorization.trim();
    debug('%s %s with %j', this.method, this.url, authorization);
    if (!authorization) {
      return yield* unauthorized.call(this, next);
    }

    authorization = new Buffer(authorization, 'base64').toString().split(':');
    if (authorization.length !== 2) {
      return yield* unauthorized.call(this, next);
    }

    var username = authorization[0];
    var password = authorization[1];
    console.log(username)
    var row;
    try {
      row = yield* UserService.auth(username, password);
    } catch (err) {
      // do not response error here
      // many request do not need login
      this.user.error = err;
    }
    if (!row) {
      debug('auth fail user: %j, headers: %j', row, this.header);
      return yield* unauthorized.call(this, next);
    }
    this.user.name = row.login;
    this.user.isAdmin = row.site_admin;
    this.user.scopes = row.scopes;
    this.user.role = row.role;
    debug('auth pass user: %j, headers: %j', this.user, this.header);
    yield* next;
  };
};

function* unauthorized(next) {
  var visitingAdminPage = this.get('X-Web-Client') || (this.url.indexOf('/admin') == 0)
  if ((!config.alwaysAuth || this.method !== 'GET') && !visitingAdminPage) {
    return yield* next;
  }
  this.status = 401;
  this.set('WWW-Authenticate', 'Basic realm="sample"');

  if (this.accepts(['html', 'json']) === 'json' || visitingAdminPage) {
    this.body = {
      error: 'unauthorized',
      reason: 'login first'
    };
  } else {
    this.body = 'login first';
  }
}
