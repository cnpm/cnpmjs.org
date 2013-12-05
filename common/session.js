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

var connect = require('connect');
var RedisStore = require('connect-redis')(connect);
var config = require('../config');

var session = connect.session({
  key: 'AuthSession',
  secret: config.sessionSecret,
  store: new RedisStore(config.redis),
  cookie: { path: '/', httpOnly: true, maxAge: 3600000 * 24 * 30 },
});

module.exports = session;
