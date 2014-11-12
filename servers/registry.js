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
var middlewares = require('koa-middlewares');
var routes = require('../routes/registry');
var logger = require('../common/logger');
var config = require('../config');
var block = require('../middleware/block');
var auth = require('../middleware/auth');
var staticCache = require('../middleware/static');
var notFound = require('../middleware/registry_not_found');

app.use(block());
middlewares.jsonp(app);
app.use(middlewares.rt({headerName: 'X-ReadTime'}));
app.use(middlewares.rewrite('/favicon.ico', '/favicon.png'));
app.use(staticCache);

app.keys = ['todokey', config.sessionSecret];
app.proxy = true;
app.use(middlewares.bodyParser({jsonLimit: config.jsonLimit}));
app.use(auth());
app.use(notFound);

if (config.enableCompress) {
  app.use(middlewares.compress({threshold: 150}));
}
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
  console.log(err);
  console.log(err.stack);
  err.url = err.url || ctx.request.url;
  logger.error(err);
});

app = http.createServer(app.callback());

if (!module.parent) {
  app.listen(config.registryPort);
}

module.exports = app;
