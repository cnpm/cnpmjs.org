'use strict';

const koa = require('koa');
let app = module.exports = koa();
const http = require('http');
const middlewares = require('koa-middlewares');
const router = require('koa-router');
const routes = require('../routes/registry');
const logger = require('../common/logger');
const config = require('../config');
const block = require('../middleware/block');
const auth = require('../middleware/auth');
const staticCache = require('../middleware/static');
const notFound = require('../middleware/registry_not_found');
const cors = require('kcors');
const proxyToNpm = require('../middleware/proxy_to_npm');
const maxrequests = require('koa-maxrequests');

app.use(maxrequests());
app.use(block());
middlewares.jsonp(app);
app.use(middlewares.rt({ headerName: 'X-ReadTime' }));
app.use(middlewares.rewrite('/favicon.ico', '/favicon.png'));
app.use(staticCache);

app.keys = [ 'todokey', config.sessionSecret ];
app.proxy = true;
app.use(middlewares.bodyParser({ jsonLimit: config.jsonLimit }));
app.use(cors({
  allowMethods: 'GET,HEAD',
}));
app.use(auth());
app.use(proxyToNpm());
app.use(notFound);

if (config.enableCompress) {
  app.use(middlewares.compress({ threshold: 150 }));
}
app.use(middlewares.conditional());
app.use(middlewares.etag());

/**
 * Routes
 */

app.use(router(app));
routes(app);

/**
 * Error handler
 */

app.on('error', function(err, ctx) {
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
