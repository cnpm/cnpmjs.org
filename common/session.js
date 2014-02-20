/*!
 * cnpmjs.org - common/session.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var session = require('koa-sess');
var redisStore = require('koa-redis');
var config = require('../config');

var key = 'AuthSession';
var cookie = { path: '/', httpOnly: true, maxAge: 3600000 * 24 * 30 };
var options = {
  key: key,
  cookie: cookie,
};

if (!config.debug) {
  options.store = config.sessionStore || redisStore(config.redis);
}

module.exports = session(options);
