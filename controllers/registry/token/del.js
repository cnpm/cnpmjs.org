'use strict';

var tokenService = require('../../../services/token');

module.exports = function* deleteToken() {
  yield tokenService.deleteToken(this.user.name, this.params.UUID);
  this.status = 204;
};
