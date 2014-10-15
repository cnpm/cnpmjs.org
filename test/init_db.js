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
var path = require('path');
var childProcess = require('child_process');
var config = require('../config');

config.database.logging = console.log;
if (process.env.DB) {
  config.database.dialect = process.env.DB;
}

// init db first
var initscript = path.join(__dirname, '..', 'models', 'init_script.js');
var cmd = ['node', '--harmony', initscript, 'true', config.database.dialect].join(' ');
console.log('$ %s', cmd);
var stdout = childProcess.execSync(cmd);
process.stdout.write(stdout);

var models = require('../models');
var User = models.User;

var usernames = [
  'cnpmjstest101',
  'cnpmjstest102',
  'cnpmjstest10', // admin
  'cnpmjstestAdmin2', // other admin
  'cnpmjstestAdmin3', // other admin
];

var count = usernames.length;
usernames.forEach(function (name) {
  var user = User.build({
    name: name,
    email: 'fengmk2@gmail.com',
    ip: '127.0.0.1',
    rev: '1',
  });
  user.salt = crypto.randomBytes(30).toString('hex');
  user.password_sha = User.createPasswordSha(name, user.salt);
  user.save().then(function (newUser) {
    count--;
    if (count === 0) {
      console.log('[test/init_db.js] init test users success');
      process.exit(0);
    }
  }).catch(function (err) {
    throw err;
  });
});