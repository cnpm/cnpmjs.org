'use strict';

// https://docs.npmjs.com/cli/whoami
module.exports = function* () {
  this.status = 200;
  this.body = {
    username: this.user.name,
  };
}
