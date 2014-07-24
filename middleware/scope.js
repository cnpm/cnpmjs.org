/**!
 * cnpmjs.org - middleware/scope.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
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
  if (!name || !config.scopes || !config.scopes.length) {
    return yield* next;
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
