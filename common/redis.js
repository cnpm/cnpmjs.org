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

var redis = require('redis');
var wrapper = require('co-redis');
var config = require('../config');
var logger = require('./logger');

var _client = redis.createClient(config.redis);

_client.on('error', function (err) {
  logger.error(err);
});

module.exports = wrapper(_client);
