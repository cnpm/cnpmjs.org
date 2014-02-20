/**!
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

var koa = require('koa');
var app = module.exports = koa();
var http = require('http');
var forward = require('forward');
var path = require('path');
var rt = require('koa-rt');
var rewrite = require('koa-rewrite');
var router = require('koa-router');
var routes = require('../routes/registry');
var logger = require('../common/logger');
var config = require('../config');
var session = require('../common/session');
var auth = require('../middleware/auth');

var rootdir = path.dirname(__dirname);

app.use(rt({headerName: 'X-ReadTime'}));

app.use(rewrite('/favicon.ico', '/public/favicon.ico'));

// app.use(responseCookie());
// app.use(connect.cookieParser());
// app.use(connect.query());
// app.use(connect.json());

app.keys = ['todokey', config.sessionSecret];
app.use(session);
// app.use(auth());

/**
 * Routes
 */

app.use(router(app));
routes(app);

/**
 * Error handler
 */

app.on('error', function (err, ctx) {
  err.url = err.url || ctx.request.url;
  logger.error(err);
  // if (config.debug) {
  //   return next(err);
  // }
  // res.json(500, {
  //   error: err.name,
  //   reason: err.message
  // });
});

app = http.createServer(app.callback());

if (!module.parent) {
  app.listen(config.registryPort);
}

module.exports = app;
