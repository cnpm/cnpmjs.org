/**!
 * cnpmjs.org - middleware/static.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var path = require('path');
var middlewares = require('koa-middlewares');
var config = require('../config');

var staticDir = path.join(path.dirname(__dirname), 'public');

module.exports = middlewares.staticCache(staticDir, {
  buffer: config.debug ? false : true,
  maxAge: config.debug ? 0 : 60 * 60 * 24 * 7,
  alias: {
    '/favicon.ico': '/favicon.png'
  },
  gzip: config.enableCompress,
});
