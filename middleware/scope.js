/**!
 * cnpmjs.org - middleware/scope.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   dead-horse <dead_borse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:middleware:scope');
var config = require('../config');
var util = require('util');

module.exports = function* assertScope(next) {
  var name = this.params[0];
  // if config.scopes.length === 0, means do not support scope
  // respond 404
  if (!name || !config.scopes || !config.scopes.length) {
    return;
  }
  var scope = name.split('/')[0];
  if (config.scopes.indexOf(scope) < 0) {
    debug('assert scope %s error', name);
    this.status = 400;
    this.body = {
      error: 'invalid scope',
      reason: util.format('scope %s not match legal scopes %j', scope, config.scopes)
    };
    return;
  }
  yield* next;
};
