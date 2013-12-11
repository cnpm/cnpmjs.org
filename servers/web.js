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

require('response-patch');
var path = require('path');
var http = require('http');
var connect = require('connect');
var rt = require('connect-rt');
var urlrouter = require('urlrouter');
var connectMarkdown = require('connect-markdown');
var routes = require('../routes/web');
var logger = require('../common/logger');
var config = require('../config');
var session = require('../common/session');
var render = require('connect-render');
var opensearch = require('../middleware/opensearch');
var app = connect();

app.use(rt({headerName: 'X-ReadTime'}));
app.use(function (req, res, next) {
  res.req = req;
  next();
});

app.use('/opensearch.xml', opensearch);

app.use(connect.cookieParser());
app.use(session);
app.use(connect.query());
app.use(connect.json());

var rootdir = path.dirname(__dirname);
var viewDir = path.join(rootdir, 'view', 'web');
var docDir = path.join(rootdir, 'docs', 'web');

app.use('/', connectMarkdown({
  root: docDir,
  layout: path.join(viewDir, 'layout.html'),
  titleHolder: '<%- locals.title %>',
  bodyHolder: '<%- locals.body %>',
  indexName: 'readme'
}));

var helpers = {
  config: config
};

app.use(render({
  root: viewDir,
  viewExt: '.html',
  layout: 'layout',
  cache: config.viewCache,
  helpers: helpers
}));

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
