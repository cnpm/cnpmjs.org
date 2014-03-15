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
    debug('%s, %s, %j', this.url, this.sessionId, session);
    session.onlySync = config.enablePrivate ? true : false;
    if (session.name) {
      session.isAdmin = common.isAdmin(session.name);
      debug('auth exists user: %s, onlySync: %s, isAdmin: %s, headers: %j',
        session.name, session.onlySync, session.isAdmin, this.header);
      return yield *next;
    }
    var authorization = (this.get('authorization') || '').split(' ')[1] || '';
    authorization = authorization.trim();
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
      session.name = null;
      session.isAdmin = false;
      return yield *next;
    }

    session.name = row.name;
    session.isAdmin = common.isAdmin(session.name);
    debug('auth pass user: %j, onlySync: %s, isAdmin: %s, headers: %j',
      row, session.onlySync, session.isAdmin, this.header);
    yield *next;
  };
};
