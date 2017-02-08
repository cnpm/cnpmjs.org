'use strict';

const crypto = require('crypto');
const path = require('path');
const childProcess = require('child_process');
require('./init');
const config = require('../config');

// init db first
const initscript = path.join(__dirname, '..', 'models', 'init_script.js');
const cmd = [ 'node', initscript, 'true',
  config.database.dialect, config.database.port, config.database.username ].join(' ');
console.log('$ %s', cmd);
const stdout = childProcess.execSync(cmd);
process.stdout.write(stdout);

const models = require('../models');
const User = models.User;

const usernames = [
  'cnpmjstest101_normal_user',
  'cnpmjstest101',
  'cnpmjstest102',
  'cnpmjstest103',
  [ 'cnpmjstest104', 'cnpmjs:test104' ],
  'cnpmjstest10', // admin
  'cnpmjstestAdmin2', // other admin
  'cnpmjstestAdmin3', // other admin
  'cnpmjstest_list_by_user',
];

let count = usernames.length;
usernames.forEach(function(name) {
  let pass;
  if (Array.isArray(name)) {
    name = name[0];
    pass = name[1];
  } else {
    pass = name;
  }
  const user = User.build({
    name,
    email: 'fengmk2@gmail.com',
    ip: '127.0.0.1',
    rev: '1',
  });
  user.salt = crypto.randomBytes(30).toString('hex');
  user.password_sha = User.createPasswordSha(pass, user.salt);
  user.save().then(function() {
    count--;
    if (count === 0) {
      console.log('[test/init_db.js] init test users success');
      process.exit(0);
    }
  }).catch(function(err) {
    console.log(err);
    process.exit(1);
  });
});
