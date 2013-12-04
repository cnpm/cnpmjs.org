/*!
 * cnpmjs.org - common/session.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var connect = require('connect');
var connect = require('connect');
var MySQLStore = require('connect-mysql')(connect);
var pool = require('./mysql').pool;
var config = require('../config');

var store = new MySQLStore({client: pool});

var session = connect.session({
  key: 'AuthSession',
  secret: config.sessionSecret,
  store: store,
  cookie: { path: '/', httpOnly: true, maxAge: 3600000 * 24 * 30 },
});

module.exports = session;
