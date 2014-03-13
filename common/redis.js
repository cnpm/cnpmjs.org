/*!
 * cnpmjs.org - common/redis.js
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

// close redis by set config.redis to `null` or `{}`
if (!config.redis || !config.redis.host || !config.redis.port) {

  var redis = require('redis');
  var wrapper = require('co-redis');
  var logger = require('./logger');

  var _client = redis.createClient(config.redis);

  _client.on('error', function (err) {
    logger.error(err);
  });

  module.exports = wrapper(_client);

} else {
  console.warn('can not found')
  module.exports = null;
}
