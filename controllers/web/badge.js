/**!
 * cnpmjs.org - controllers/web/badge.js
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

var config = require('../../config');
var Module = require('../../proxy/module');

exports.version = function* (next) {
  var color = 'lightgrey';
  var version = 'invalid';
  var name = this.params[0];
  var latestTag = yield* Module.getTag(name, 'latest');
  if (latestTag) {
    color = 'blue';
    version = latestTag.version;
  }

  var url = 'https://img.shields.io/badge/' + config.badgeSubject + '-' + version + '-' + color + '.svg';
  if (this.querystring) {
    url += '?' + this.querystring;
  }

  this.redirect(url);
};
