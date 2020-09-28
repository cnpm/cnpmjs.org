'use strict';

var debug = require('debug')('cnpmjs.org:middleware:auth');
var UserService = require('../services/user');
var TokenService = require('../services/token');
var config = require('../config');
var common = require('../lib/common')

/**
 * Parse the request authorization222
 * get the real user
 */

module.exports = function () {
  return function* auth(next) {
    this.user = {};

    var authorization = (this.get('authorization') || '').trim();
    debug('%s %s with %j', this.method, this.url, authorization);
    if (!authorization) {
      return yield unauthorized.call(this, next);
    }

    var row;
    try {
      var authorizeType = common.getAuthorizeType(this);

      if (authorizeType === common.AuthorizeType.BASIC) {
        row = yield basicAuth(authorization);
      } else if (authorizeType === common.AuthorizeType.BEARER) {
        row = yield bearerAuth(authorization, this.method, this.ip);
      } else {
        return yield unauthorized.call(this, next);
      }
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

function* basicAuth(authorization) {
  authorization = authorization.split(' ')[1];
  authorization = Buffer.from(authorization, 'base64').toString();

  var pos = authorization.indexOf(':');
  if (pos === -1) {
    return null;
  }

  var username = authorization.slice(0, pos);
  var password = authorization.slice(pos + 1);

  return yield UserService.auth(username, password);
}

function* bearerAuth(authorization, method, ip) {
  var token = authorization.split(' ')[1];
  var isReadOperation = method === 'HEAD' || method === 'GET';
  return yield TokenService.validateToken(token, {
    isReadOperation: isReadOperation,
    accessIp: ip,
  });
}

function* unauthorized(next) {
  if (!config.alwaysAuth || this.method !== 'GET') {
    return yield next;
  }
  this.status = 401;
  this.set('WWW-Authenticate', 'Basic realm="sample"');
  if (this.accepts(['html', 'json']) === 'json') {
    const error = '[unauthorized] login first';
    this.body = {
      error,
      reason: error,
    };
  } else {
    this.body = 'login first';
  }
}
