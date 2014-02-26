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
    debug('%s, %s, %j', this.url, this.sessionId, this.session);
    if (!this.session) {
      // redis crash
      this.session = {};
      return yield next;
    }
    this.session.onlySync = config.enablePrivate ? true : false;
    if (this.session.name) {
      this.session.isAdmin = common.isAdmin(this.session.name);
      debug('auth exists user: %s, onlySync: %s, isAdmin: %s, headers: %j',
        this.session.name, this.session.onlySync, this.session.isAdmin, this.header);
      return yield next;
    }
    var authorization = (this.get('authorization') || '').split(' ')[1] || '';
    authorization = authorization.trim();
    if (!authorization) {
      return yield next;
    }

    authorization = new Buffer(authorization, 'base64').toString().split(':');
    if (authorization.length !== 2) {
      return yield next;
    }

    var username = authorization[0];
    var password = authorization[1];

    var row = yield User.auth(username, password);
    if (!row) {
      debug('auth fail user: %j, headers: %j', row, this.header);
      this.session.name = null;
      this.session.isAdmin = false;
      return yield next;
    }

    this.session.name = row.name;
    this.session.isAdmin = common.isAdmin(this.session.name);
    debug('auth pass user: %j, onlySync: %s, isAdmin: %s, headers: %j',
      row, this.session.onlySync, this.session.isAdmin, this.header);
    yield next;
  };
};
