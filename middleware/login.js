/*!
 * cnpmjs.org - middleware/login.js
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

module.exports = function login(req, res, next) {
  if (!req.session.name) {
    return res.json(401, {
      error: 'unauthorized',
      reason: 'Login first.'
    });
  }
  next();
};
