'use strict';

const path = require('path');
const middlewares = require('koa-middlewares');
const config = require('../config');

const staticDir = path.join(path.dirname(__dirname), 'public');

module.exports = middlewares.staticCache(staticDir, {
  buffer: !config.debug,
  maxAge: config.debug ? 0 : 60 * 60 * 24 * 7,
  alias: {
    '/favicon.ico': '/favicon.png',
  },
  gzip: config.enableCompress,
});
