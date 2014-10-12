/**!
 * cnpmjs.org - test/init_db.js
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

config.database.logging = console.log;
if (process.env.DB) {
  config.database.dialect = process.env.DB;
}

var sequelize = require('../common/sequelize');
var User = require('../models').User;

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
  console.log('[test/init_db.js] sequelize sync `%s` success', config.database.dialect);

  var count = usernames.length;
  usernames.forEach(function (name) {
    var user = User.build({
      name: name,
      email: 'fengmk2@gmail.com',
      ip: '127.0.0.1',
      rev: '1',
    });
    user.salt = crypto.randomBytes(30).toString('hex');
    user.passwordSha = User.createPasswordSha(name, user.salt);
    user.save().then(function (newUser) {
      count--;
      if (count === 0) {
        process.exit(0);
      }
    }).catch(function (err) {
      throw err;
    });
  });
}).catch(function (err) {
  throw err;
});
