'use strict';


const config = require('../../../config');
const userService = require('../../../services/user');
const User = require('../../../models').User;

exports.userList = function* userList() {
  let page = this.query.page || 1;
  let perPage = this.query.perPage || 10;
  this.body = yield userService.userList(page, perPage)
};

exports.updateUser = function* updateUser() {
  let slots = ['name', 'email', 'role'];
  let uid = Number(this.params.uid);

  let user = yield User.findOne({
    where: {
      id: uid
    }
  });

  if (!user) {
    this.throw(400, 'bad uid')
  }

  let form = this.request.body;
  for (let key in this.request.body) {
    if (~slots.indexOf(key)) {
      if (!checkConstrain(key, form[key])) {
        this.throw(400, `bad ${key}: ${form[key]}`)
      }
      console.log(key, form[key])
      user[key] = Number(form[key]);
    }
  }

  let success = yield user.save();
  let stat = success ? 'ok' : 'fail';
  this.body = {
    stat,
    data: success
  }

  function checkConstrain(key, value) {
    if (key === 'role') {
      return !isNaN(value) && value >= 0 && value <= 2
    } else {
      return typeof value === 'string'
    }
  }
};
