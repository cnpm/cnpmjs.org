'use strict';

var tokenService = require('../../../services/token');

var DEFAULT_PER_PAGE = 10;
var MIN_PER_PAGE = 1;
var MAX_PER_PAGE = 9999;

module.exports = function* createToken() {
  var perPage = typeof this.query.perPage === 'undefined' ? DEFAULT_PER_PAGE : parseInt(this.query.perPage);
  if (Number.isNaN(perPage)) {
    this.status = 400;
    var error = 'perPage ' + this.query.perPage + ' is not a number';
    this.body = {
      error,
      reason: error,
    };
    return;
  }
  if (perPage < MIN_PER_PAGE || perPage > MAX_PER_PAGE) {
    this.status = 400;
    var error = 'perPage ' + this.query.perPage + ' is out of boundary';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  var page = typeof this.query.page === 'undefined' ? 0 : parseInt(this.query.page);
  if (Number.isNaN(page)) {
    this.status = 400;
    var error = 'page ' + this.query.page + ' is not a number';
    this.body = {
      error,
      reason: error,
    };
    return;
  }
  if (page < 0) {
    this.status = 400;
    var error = 'page ' + this.query.page + ' is invalidate';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  var tokens = yield tokenService.listToken(this.user.name, {
    page: page,
    perPage: perPage,
  });

  this.status = 200;
  this.body = {
    objects: tokens,
    urls: {},
  };
};
