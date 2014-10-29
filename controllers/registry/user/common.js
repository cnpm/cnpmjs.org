/**!
 * cnpmjs.org - controllers/registry/user/common.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var crypto = require('crypto');
var utility = require('utility');

exports.ensurePasswordSalt = function (user, body) {
  if (!user.password_sha && body.password) {
    // create password_sha on server
    user.salt = crypto.randomBytes(30).toString('hex');
    user.password_sha = utility.sha1(body.password + user.salt);
  }
};
