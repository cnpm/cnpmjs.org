'use strict';

var koa = require('koa');
var app = module.exports = koa();
var http = require('http');
var middlewares = require('koa-middlewares');
var bodyParser = require('koa-bodyparser');
var rt = require('koa-rt');
var rewrite = require('koa-rewrite');
var conditional = require('koa-conditional-get');
var etag = require('koa-etag');
var routes = require('../routes/registry');
var logger = require('../common/logger');
var config = require('../config');
var block = require('../middleware/block');
var auth = require('../middleware/auth');
var staticCache = require('../middleware/static');
var notFound = require('../middleware/registry_not_found');
var cors = require('kcors');
var proxyToNpm = require('../middleware/proxy_to_npm');
var maxrequests = require('koa-maxrequests');

app.use(maxrequests());
app.use(block());
middlewares.jsonp(app);
app.use(rt({ headerName: 'X-ReadTime' }));
app.use(rewrite('/favicon.ico', '/favicon.png'));
app.use(staticCache);

app.keys = ['todokey', config.sessionSecret];
app.proxy = true;
app.use(bodyParser({ jsonLimit: config.jsonLimit, strict: false }));
app.use(cors({
  allowMethods: 'GET,HEAD',
}));
app.use(auth());
app.use(proxyToNpm());
app.use(notFound);

if (config.enableCompress) {
  app.use(middlewares.compress({ threshold: 150 }));
}
app.use(conditional());
app.use(etag());

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
