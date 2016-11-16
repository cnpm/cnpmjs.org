"use strict";
// Only support for ./services/DefaultUserService. If you use custom user service, ignore this file.
// call with:
// $ node ./bin/change_password.js 'username' 'new_password'

var UserModel = require('../models').User;
var co = require('co');
var utility = require('utility');

var username = process.argv[2];
var newPassword = process.argv[3];

co(function * () {
  var user = yield UserModel.find({where: {name: username}});
  var salt = user.salt;
  console.log(`user original password_sha: ${user.password_sha}`);
  var newPasswordSha = utility.sha1(newPassword + salt);
  user.password_sha = newPasswordSha;
  user = yield user.save();
  console.log(`change user password successful!! user new password_sha: ${user.password_sha}`);
  process.exit(0);
}).catch(function (e) {
  console.log(e);
});
