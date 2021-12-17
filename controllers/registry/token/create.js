'use strict';

var ipRegex = require('ip-regex');
var tokenService = require('../../../services/token');
var userService = require('../../../services/user');
var ipv4 = ipRegex.v4({ exact: true });

module.exports = function* createToken() {
  var readonly = this.request.body.readonly;
  if (typeof readonly !== 'undefined' && typeof readonly !== 'boolean') {
    this.status = 400;
    var error = '[bad_request] readonly ' + readonly + ' is not boolean';
    this.body = {
      error,
      reason: error,
    };
    return;
  }
  var cidrWhitelist = this.request.body.cidr_whitelist;
  if (typeof cidrWhitelist !== 'undefined') {
    var isValidateWhiteList = Array.isArray(cidrWhitelist) && cidrWhitelist.every(function (cidr) {
      return ipv4.test(cidr);
    });
    if (!isValidateWhiteList) {
      this.status = 400;
      var error = '[bad_request] cide white list ' + JSON.stringify(cidrWhitelist) + ' is not validate ip array';
      this.body = {
        error,
        reason: error,
      };
      return;
    }
  }

  var password = this.request.body.password;
  var user = yield userService.auth(this.user.name, password);
  if (!user) {
    this.status = 401;
    var error = '[unauthorized] incorrect or missing password.';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  var tokenServiceImpl = this.tokenService || tokenService;

  var token = yield tokenServiceImpl.createToken(this.user.name, {
    readonly: !!readonly,
    cidrWhitelist: cidrWhitelist || [],
  });
  this.status = 201;
  this.body = token;
};
