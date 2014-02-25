/*!
 * cnpmjs.org - servers/registry.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

require('response-patch');
var http = require('http');
var connect = require('connect');
var rt = require('connect-rt');
var responseCookie = require('response-cookie');
var urlrouter = require('urlrouter');
var forward = require('forward');
var path = require('path');
var routes = require('../routes/registry');
var logger = require('../common/logger');
var config = require('../config');
var session = require('../common/session');
var auth = require('../middleware/auth');

var rootdir = path.dirname(__dirname);
var app = connect();

app.use(rt({headerName: 'X-ReadTime'}));
app.use(function (req, res, next) {
  res.req = req;
  next();
});

app.use('/favicon.ico', forward(path.join(rootdir, 'public', 'favicon.png')));

app.use('/dist', connect.static(config.uploadDir));

app.use(responseCookie());
app.use(connect.cookieParser());
app.use(connect.query());
app.use(connect.json({limit: config.jsonLimit}));
app.use(session);
app.use(auth());

/**
 * Routes
 */

app.use(urlrouter(routes));

app.use(function (req, res, next) {
  res.json(404, {error: 'not_found', reason: 'document not found'});
});

/**
 * Error handler
 */

app.use(function (err, req, res, next) {
  err.url = err.url || req.url;
  logger.error(err);
  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }
  if (config.debug) {
    return next(err);
  }
  res.json(500, {
    error: err.name,
    reason: err.message
  });
});

app = http.createServer(app);

module.exports = app;
