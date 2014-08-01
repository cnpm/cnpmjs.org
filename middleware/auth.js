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

/**
 * Parse the request authorization
 * get the real user
 */

module.exports = function (options) {
  return function* auth(next) {
    this.user = {};

    var authorization = (this.get('authorization') || '').split(' ')[1] || '';
    authorization = authorization.trim();
    debug('%s %s with %j', this.method, this.url, authorization);
    if (!authorization) {
      return yield* next;
    }

    authorization = new Buffer(authorization, 'base64').toString().split(':');
    if (authorization.length !== 2) {
      return yield* next;
    }

    var username = authorization[0];
    var password = authorization[1];

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
      return yield* next;
    }

    this.user.name = row.login;
    this.user.isAdmin = row.site_admin;
    this.user.scopes = row.scopes;
    debug('auth pass user: %j, headers: %j', this.user, this.header);
    yield* next;
  };
};
