'use strict';
// Only support for ./services/DefaultUserService. If you use custom user service, ignore this file.
// call with:
// $ node ./bin/change_password.js 'username' 'new_password'

const UserModel = require('../models').User;
const co = require('co');
const utility = require('utility');

const username = process.argv[2];
const newPassword = process.argv[3];

co(function* () {
  let user = yield UserModel.find({ where: { name: username } });
  const salt = user.salt;
  console.log(`user original password_sha: ${user.password_sha}`);
  const newPasswordSha = utility.sha1(newPassword + salt);
  user.password_sha = newPasswordSha;
  user = yield user.save();
  console.log(`change user password successful!! user new password_sha: ${user.password_sha}`);
  process.exit(0);
}).catch(function(e) {
  console.log(e);
});
