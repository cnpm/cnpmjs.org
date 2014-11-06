/**!
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
var middlewares = require('koa-middlewares');
var markdown = require('koa-markdown');
var opensearch = require('../middleware/opensearch');
var notFound = require('../middleware/web_not_found');
var staticCache = require('../middleware/static');
var auth = require('../middleware/auth');
var routes = require('../routes/web');
var logger = require('../common/logger');
var config = require('../config');

var app = koa();

var rootdir = path.dirname(__dirname);

app.use(middlewares.rt({headerName: 'X-ReadTime'}));
app.use(middlewares.rewrite('/favicon.ico', '/favicon.png'));
app.use(staticCache);

app.use(opensearch);
app.keys = ['todokey', config.sessionSecret];
app.proxy = true;
app.use(middlewares.bodyParser());
app.use(auth());
app.use(notFound);

if (config.enableCompress) {
  app.use(middlewares.compress({threshold: 150}));
}

app.use(middlewares.conditional());
app.use(middlewares.etag());

var viewDir = path.join(rootdir, 'view', 'web');
var docDir = path.join(rootdir, 'docs', 'web');

var layoutFile = path.join(viewDir, '_layout.html');
var footer = config.customFooter || fs.readFileSync(path.join(viewDir, 'footer.html'), 'utf8');
var layout = fs.readFileSync(path.join(viewDir, 'layout.html'), 'utf8')
  .replace('{{footer}}', footer)
  .replace('{{logoURL}}', config.logoURL);
fs.writeFileSync(layoutFile, layout);

// custom web readme home page support
var readmeFile = path.join(docDir, '_readme.md');
var readmeContent;
if (config.customReadmeFile) {
  readmeContent = fs.readFileSync(config.customReadmeFile, 'utf8');
} else {
  readmeContent = fs.readFileSync(path.join(docDir, 'readme.md'), 'utf8');
}
fs.writeFileSync(readmeFile, readmeContent);

app.use(markdown({
  baseUrl: '/',
  root: docDir,
  layout: layoutFile,
  titleHolder: '<%- locals.title %>',
  bodyHolder: '<%- locals.body %>',
  indexName: '_readme',
  remarkableOptions: {
    html: true
  }
}));

var locals = {
  config: config
};

middlewares.ejs(app, {
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
app.use(middlewares.router(app));
routes(app);

/**
 * Error handler
 */

app.on('error', function (err, ctx) {
  err.url = err.url || ctx.request.url;
  console.log(err.stack);
  logger.error(err);
});

app = http.createServer(app.callback());

if (!module.parent) {
  app.listen(config.webPort);
}

module.exports = app;
