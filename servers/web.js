/*!
 * cnpmjs.org - servers/web.js
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

var path = require('path');
var http = require('http');
var fs = require('fs');
var koa = require('koa');
var rt = require('koa-rt');
var bodyParser = require('koa-bodyparser');
var markdown = require('koa-markdown');
var staticCache = require('koa-static-cache');
var render = require('koa-ejs');
var router = require('koa-router');
var session = require('../common/session');
var opensearch = require('../middleware/opensearch');
var notFound = require('../middleware/web_not_found');
var routes = require('../routes/web');
var logger = require('../common/logger');
var config = require('../config');

var app = koa();

var rootdir = path.dirname(__dirname);

app.use(rt({headerName: 'X-ReadTime'}));
app.use(staticCache(path.join(__dirname, '..', 'public'), {
  buffer: !config.debug,
  maxAge: config.debug ? 0 : 60 * 60 * 24 * 7,
  dir: path.join(rootdir, 'public')
}));
app.use(opensearch);
app.keys = ['todokey', config.sessionSecret];
app.outputErrors = true;
app.use(session);
app.use(bodyParser());
app.use(notFound);

var viewDir = path.join(rootdir, 'view', 'web');
var docDir = path.join(rootdir, 'docs', 'web');

var layoutFile = path.join(viewDir, '_layout.html');
var footer = config.customFooter || fs.readFileSync(path.join(viewDir, 'footer.html'), 'utf8');
var layout = fs.readFileSync(path.join(viewDir, 'layout.html'), 'utf8')
  .replace('{{footer}}', footer)
  .replace('{{logoURL}}', config.logoURL);
fs.writeFileSync(layoutFile, layout);

app.use(markdown({
  baseUrl: '/',
  root: docDir,
  layout: layoutFile,
  titleHolder: '<%- locals.title %>',
  bodyHolder: '<%- locals.body %>',
  indexName: 'readme'
}));

var locals = {
  config: config
};

render(app, {
  root: viewDir,
  viewExt: 'html',
  layout: '_layout',
  cache: config.viewCache,
  debug: config.debug,
  locals: locals
});

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
});

app = http.createServer(app.callback());

if (!module.parent) {
  app.listen(config.webPort);
}

module.exports = app;
