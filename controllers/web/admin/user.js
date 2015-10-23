'use strict';


const config = require('../../../config');
const userService = require('../../../services/user');
const User = require('../../../models').User;

exports.userList = function* userList() {
  let page = this.query.page || 1;
  let perPage = this.query.perPage || 10;
  this.body = yield userService.userList(page, perPage)
};

exports.updateUser = function* setRoleLevel() {
  let uid = Number(this.params.uid);
  let level = Number(this.request.body.level);

  if (isNaN(level) || level < 0 || level >= 2) {
    this.throw(400, 'row level must between 0-2')
  }


  let user = yield User.findOne({
    where: {
      id: uid
    }
  });

  if (!user) {
    this.throw(400, 'bad uid')
  }

  user.role = level;
  let success = yield user.save();
  let stat = success ? 'ok' : 'fail';
  this.body = {
    stat,
    data: success
  }
};
