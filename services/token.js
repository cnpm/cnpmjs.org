'use strict';

var Token = require('../models').Token;
var UserService = require('./user');
var uuid = require('uuid');
var crypto = require('crypto');
var DEFAULT_TOKEN_OPTIONS = {
  readonly: false,
  cidrWhitelist: [],
};
var DEFAULT_LIST_TOKEN_OPTIONS = {
  perPage: 10,
  page: 0,
};

/**
 * 1. check the token exits
 * 1. check readOnly
 * 1. check cidr white list
 *
 * @param {string} token -
 * @param {object} options -
 * @param {string} options.isReadOperation -
 * @param {string} options.accessIp -
 */
exports.validateToken = function* (token, options) {
  var row = yield Token.findByToken(token);
  if (!row) {
    return null;
  }

  var name = row.userId;
  var tokenObj = convertToken(row);
  // write operation and readonly token
  // validate fail
  if (!options.isReadOperation && tokenObj.readonly) {
    return null;
  }

  // has a cidr whitelist and access ip not in list
  // validate fail
  var cidrWhitelist = tokenObj.cidr_whitelist;
  if (cidrWhitelist.length && !cidrWhitelist.includes(options.accessIp)) {
    return null;
  }

  return yield UserService.get(name);
};

/**
 * create token for user
 * @param {string} userId -
 * @param {object} [options] -
 * @param {object} [options.readonly] - default is false
 * @param {object} [options.cidrWhitelist] - default is []
 */
exports.createToken = function* (userId, options) {
  options = Object.assign({}, DEFAULT_TOKEN_OPTIONS, options);
  var token = uuid.v4();
  var key = createTokenKey(token);
  var tokenObj = {
    token: token,
    userId: userId,
    readonly: options.readonly,
    key: key,
    cidrWhitelist: options.cidrWhitelist,
  };
  var row = yield Token.add(tokenObj);
  return convertToken(row, { redacte: false });
};

/**
 * list token for user
 * @param {string} userId -
 * @param {object} [options] -
 * @param {object} [options.perPage] - default is 10
 * @param {object} [options.page] - default is 0
 */
exports.listToken = function* (userId, options) {
  options = Object.assign({}, DEFAULT_LIST_TOKEN_OPTIONS, options);
  var rows = yield Token.listByUser(userId, options.perPage * options.page, options.perPage);
  return rows.map(function(row) {
    return convertToken(row);
  });
};

/**
 * delete token for user
 * @param {string} userId -
 * @param {string} keyOrToken - the key prefix or full token
 */
exports.deleteToken = function* (userId, keyOrToken) {
  yield Token.deleteByKeyOrToken(userId, keyOrToken);
};

function convertToken(row, options) {
  options = options || {};
  var token = row.token;
  if (options.redacte !== false) {
    token = redacteToken(token);
  }
  return {
    token: token,
    key: row.key,
    cidr_whitelist: row.cidrWhitelist,
    created: row.gmt_create,
    updated: row.gmt_create,
    readonly: row.readonly,
  };
}

function redacteToken(token) {
  if (!token) {
    return null;
  }
  return `${token.substr(0, 6)}...${token.substr(-6)}`;
}

function createTokenKey(token) {
  return crypto.createHash('sha512').update(token).digest('hex');
}
