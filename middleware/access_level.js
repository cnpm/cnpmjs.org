'use strict';

const auth = require('./auth')();
const compose = require('koa-compose');


module.exports = function (level) {
  function* access_level(next) {
    if (this.user.role >= level || this.user.id === 0) {
      yield *next;
    } else {
      this.throw(403);
    }
  }
  return compose([auth, access_level]);
};


