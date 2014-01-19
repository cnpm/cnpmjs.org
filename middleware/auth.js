/*!
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
  return function auth(req, res, next) {
    if (!req.session) {
      // redis crash
      req.session = {};
      return next();
    }
    req.session.onlySync = config.enablePrivate ? true : false;
    if (req.session.name) {
      req.session.isAdmin = common.isAdmin(req.session.name);
      debug('auth exists user: %s, onlySync: %s, isAdmin: %s, headers: %j',
        req.session.name, req.session.onlySync, req.session.isAdmin, req.headers);
      return next();
    }
    var authorization = (req.headers.authorization || '').split(' ')[1] || '';
    authorization = authorization.trim();
    if (!authorization) {
      return next();
    }
    authorization = new Buffer(authorization, 'base64').toString().split(':');
    var username = authorization[0];
    var password = authorization[1];

    User.auth(username, password, function (err, row) {
      if (err) {
        return next(err);
      }

      if (!row) {
        debug('auth fail user: %j, headers: %j', row, req.headers);
        return res.json(401, {
          error: 'unauthorized',
          reason: 'Name or password is incorrect.'
        });
      }

      req.session.name = row.name;
      req.session.isAdmin = common.isAdmin(req.session.name);
      debug('auth pass user: %j, onlySync: %s, isAdmin: %s, headers: %j',
        row, req.session.onlySync, req.session.isAdmin, req.headers);
      next();
    });
  };
};
