/**!
 * cnpmjs.org - controllers/web/dist.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var config = require('../../config');

exports.redirect = function *(next) {
  var params = this.params;
  // a bug in koa-router
  // i'll make a PR
  if (params[0] === 'undefined') {
    params[0] = '/';
  }
  var url = config.disturl + (params[0] || '/');
  this.redirect(url);
};
