'use strict';

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
      return yield unauthorized.call(this, next);
    }

    authorization = new Buffer(authorization, 'base64').toString();
    var pos = authorization.indexOf(':');
    if (pos === -1) {
       return yield unauthorized.call(this, next);
    }

    var username = authorization.slice(0, pos);
    var password = authorization.slice(pos + 1);

    var row;
    try {
      row = yield UserService.auth(username, password);
    } catch (err) {
      // do not response error here
      // many request do not need login
      this.user.error = err;
    }

    if (!row) {
      debug('auth fail user: %j, headers: %j', row, this.header);
      return yield unauthorized.call(this, next);
    }

    this.user.name = row.login;
    this.user.isAdmin = row.site_admin;
    this.user.scopes = row.scopes;
    debug('auth pass user: %j, headers: %j', this.user, this.header);
    yield next;
  };
};

function* unauthorized(next) {
  if (!config.alwaysAuth || this.method !== 'GET') {
    return yield next;
  }
  this.status = 401;
  this.set('WWW-Authenticate', 'Basic realm="sample"');
  if (this.accepts(['html', 'json']) === 'json') {
    this.body = {
      error: 'unauthorized',
      reason: 'login first'
    };
  } else {
    this.body = 'login first';
  }
}
