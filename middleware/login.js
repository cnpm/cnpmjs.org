'use strict';

var http = require('http');

module.exports = function *login(next) {
  if (this.path === '/-/ping' && this.query.write !== 'true') {
    yield next;
    return;
  }

  if (this.user.error) {
    var status = this.user.error.status;
    this.status = http.STATUS_CODES[status]
      ? status
      : 500;

    const error = `[${this.user.error.name}] ${this.user.error.message}`;
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  if (!this.user.name) {
    this.status = 401;
    const error = '[unauthorized] Login first';
    this.body = {
      error,
      reason: error,
    };
    return;
  }
  yield next;
};
