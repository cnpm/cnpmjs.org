/**!
 * cnpmjs.org - middleware/limit.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var config = require('../config');
var limit = require('koa-limit');

var limitConfig = config.limit;

if (!limitConfig.enable) {
  module.exports = function *ignoreLimit(next) {
    yield *next;
  };
} else {
  module.exports = limit(limitConfig);
}
