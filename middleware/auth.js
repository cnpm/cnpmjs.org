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

module.exports = function (options) {
  return function auth(req, res, next) {
    if (req.session.name) {
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
      if (row) {
        req.session.name = row.name;
      }
      debug('auth user: %j, headers: %j', row, req.headers);
      next(err);
    });
  };
};
