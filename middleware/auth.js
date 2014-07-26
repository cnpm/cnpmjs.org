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
var User = require('../proxy/user');
var config = require('../config');
var common = require('../lib/common');

module.exports = function (options) {
  return function *auth(next) {
    var session = yield *this.session;
    this.user = {};

    if (session.name) {
      this.user.name = session.name;
      this.user.isAdmin = common.isAdmin(session.name);
      debug('auth exists user: %j, headers: %j', this.user, this.header);
      return yield *next;
    }

    var authorization = (this.get('authorization') || '').split(' ')[1] || '';
    authorization = authorization.trim();
    debug('%s with %j', this.url, authorization);
    if (!authorization) {
      return yield *next;
    }

    authorization = new Buffer(authorization, 'base64').toString().split(':');
    if (authorization.length !== 2) {
      return yield *next;
    }

    var username = authorization[0];
    var password = authorization[1];

    var row = yield User.auth(username, password);
    if (!row) {
      debug('auth fail user: %j, headers: %j', row, this.header);
      return yield *next;
    }

    this.user.name = row.name;
    this.user.isAdmin = common.isAdmin(row.name);
    debug('auth pass user: %j, headers: %j', this.user, this.header);
    yield *next;
  };
};
