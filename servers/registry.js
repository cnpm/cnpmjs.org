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
var urlrouter = require('urlrouter');
var routes = require('../routes/registry');
var logger = require('../common/logger');
var config = require('../config');

var app = connect();

app.use(rt({headerName: 'X-ReadTime'}));
app.use(function (req, res, next) {
  res.req = req;
  next();
});
app.use(connect.query());
app.use(connect.bodyParser());

/**
 * Routes
 */

app.use(urlrouter(routes));

/**
 * Error handler
 */

app.use(function (err, req, res, next) {
  err.url = err.url || req.url;
  console.error(err.stack);
  logger.error(err);
  if (config.debug) {
    return next(err);
  }
  res.statusCode = 500;
  res.send('Server has some problems. :(');
});

app = http.createServer(app);

module.exports = app;
