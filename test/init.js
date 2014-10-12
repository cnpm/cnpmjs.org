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
var config = require('../config');

if (process.env.DB) {
  config.database.dialect = process.env.DB;
}

var sequelize = require('../common/sequelize');
var User = require('../models').User;

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

sequelize.sync({ force: true })
// sequelize.sync()
.then(function () {
  console.log('[test/init.js] sequelize sync `%s` success', config.database.dialect);

  usernames.forEach(function (name) {
    var user = User.build({
      name: name,
      email: 'fengmk2@gmail.com',
      // password: 'cnpmjstest10',
      ip: '127.0.0.1',
      rev: '1',
    });
    user.salt = crypto.randomBytes(30).toString('hex');
    user.passwordSha = utility.sha1(user.name + user.salt);
    user.save().then(function (newUser) {
      // console.log(newUser.toJSON());
    }).catch(function (err) {
      throw err;
    });
  });
}).catch(function (err) {
  throw err;
});
