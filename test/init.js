/**!
 * cnpmjs.org - test/init.js
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
var User = require('../proxy/user');
var config = require('../config');

if (process.env.CNPM_SOURCE_NPM) {
  config.sourceNpmRegistry = process.env.CNPM_SOURCE_NPM;
}
if (process.env.CNPM_SOURCE_NPM_ISCNPM === 'false') {
  config.sourceNpmRegistryIsCNpm = false;
}

var usernames = [
  'cnpmjstest101',
  'cnpmjstest102',
  'cnpmjstest10', // admin
  'cnpmjstestAdmin2', // other admin
  'cnpmjstestAdmin3', // other admin
];

usernames.forEach(function (name) {
  var user = {
    name: name,
    email: 'fengmk2@gmail.com',
    // password: 'cnpmjstest10',
    ip: '127.0.0.1'
  };
  user.salt = crypto.randomBytes(30).toString('hex');
  user.password_sha = utility.sha1(user.name + user.salt);

  User.add(user, function (err, result) {
    if (err) {
      throw err;
    }
  });
});
