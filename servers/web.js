'use strict';

const opensearch = require('../middleware/opensearch');
const notFound = require('../middleware/web_not_found');
const staticCache = require('../middleware/static');
const middlewares = require('koa-middlewares');
const router = require('koa-router');
const markdownMiddleware = require('koa-markdown');
const block = require('../middleware/block');
const logger = require('../common/logger');
const renderMarkdown = require('../common/markdown').render;
const auth = require('../middleware/auth');
const proxyToNpm = require('../middleware/proxy_to_npm');
const routes = require('../routes/web');
const config = require('../config');
const jsonp = require('koa-safe-jsonp');
const path = require('path');
const http = require('http');
const koa = require('koa');
const fs = require('fs');
const maxrequests = require('koa-maxrequests');

let app = koa();

jsonp(app);

const rootdir = path.dirname(__dirname);

app.use(maxrequests());
app.use(block());
app.use(middlewares.rt({ headerName: 'X-ReadTime' }));
app.use(middlewares.rewrite('/favicon.ico', '/favicon.png'));
app.use(staticCache);

if (config.pagemock) {
  app.use(require('koa-mock')({
    datadir: path.join(rootdir, 'test', 'mocks'),
  }));
}

app.use(opensearch);
app.keys = [ 'todokey', config.sessionSecret ];
app.proxy = true;
app.use(proxyToNpm({
  isWeb: true,
}));
app.use(middlewares.bodyParser());
app.use(auth());
app.use(notFound);

if (config.enableCompress) {
  app.use(middlewares.compress({ threshold: 150 }));
}

app.use(middlewares.conditional());
app.use(middlewares.etag());

const viewDir = path.join(rootdir, 'view', 'web');
const docDir = path.join(rootdir, 'docs', 'web');

const layoutFile = path.join(viewDir, '_layout.html');
const footer = config.customFooter || fs.readFileSync(path.join(viewDir, 'footer.html'), 'utf8');
const layout = fs.readFileSync(path.join(viewDir, 'layout.html'), 'utf8')
  .replace('{{footer}}', footer)
  .replace('{{logoURL}}', config.logoURL)
  .replace('{{adBanner}}', config.adBanner || '');
fs.writeFileSync(layoutFile, layout);

// custom web readme home page support
const readmeFile = path.join(docDir, '_readme.md');
let readmeContent;
if (config.customReadmeFile) {
  readmeContent = fs.readFileSync(config.customReadmeFile, 'utf8');
} else {
  readmeContent = fs.readFileSync(path.join(docDir, 'readme.md'), 'utf8');
}
fs.writeFileSync(readmeFile, readmeContent);

app.use(markdownMiddleware({
  baseUrl: '/',
  root: docDir,
  layout: layoutFile,
  titleHolder: '<%= locals.title %>',
  bodyHolder: '<%- locals.body %>',
  indexName: '_readme',
  cache: true,
  render(content) {
    return renderMarkdown(content, false);
  },
}));

const locals = {
  config,
};

middlewares.ejs(app, {
  root: viewDir,
  viewExt: 'html',
  layout: '_layout',
  cache: config.viewCache,
  debug: config.debug,
  locals,
});

/**
 * Routes
 */

app.use(router(app));
routes(app);

/**
 * Error handler
 */

app.on('error', function(err, ctx) {
  err.url = err.url || ctx.request.url;
  console.log(err);
  console.log(err.stack);
  logger.error(err);
});

app = http.createServer(app.callback());

if (!module.parent) {
  app.listen(config.webPort);
}

module.exports = app;
