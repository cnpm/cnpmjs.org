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
var microtime = require('microtime');
var middlewares = require('koa-middlewares');
var routes = require('../routes/registry');
var logger = require('../common/logger');
var config = require('../config');
var session = require('../common/session');
var auth = require('../middleware/auth');
var notFound = require('../middleware/registry_not_found');

app.use(middlewares.rt({headerName: 'X-ReadTime', timer: microtime}));

app.use(middlewares.rewrite('/favicon.ico', '/public/favicon.ico'));

app.keys = ['todokey', config.sessionSecret];
app.outputErrors = true;
app.proxy = true;
app.use(session);
app.use(middlewares.bodyParser({jsonLimit: config.jsonLimit}));
app.use(auth());
app.use(notFound);

app.use(middlewares.compress());
app.use(middlewares.conditional());
app.use(middlewares.etag());

/**
 * Routes
 */

app.use(middlewares.router(app));
routes(app);

/**
 * Error handler
 */

app.on('error', function (err, ctx) {
  err.url = err.url || ctx.request.url;
  logger.error(err);
});

app = http.createServer(app.callback());

if (!module.parent) {
  app.listen(config.registryPort);
}

module.exports = app;
