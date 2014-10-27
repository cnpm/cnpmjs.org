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
var packageService = require('../../services/package');

exports.version = function* () {
  var color = 'lightgrey';
  var version = 'invalid';
  var name = this.params[0];
  var latestTag = yield* packageService.getModuleByTag(name, 'latest');
  if (latestTag) {
    version = latestTag.version;
    if (/^0\.0\./.test(version)) {
      // <0.1.0 & >=0.0.0
      color = 'red';
    } else if (/^0\./.test(version)) {
      // <1.0.0 & >=0.1.0
      color = 'green';
    } else {
      // >=1.0.0
      color = 'blue';
    }
  }

  var subject = config.badgeSubject.replace(/\-/g, '--');
  version = version.replace(/\-/g, '--');
  var url = 'https://img.shields.io/badge/' + subject + '-' + version + '-' + color + '.svg';
  if (this.querystring) {
    url += '?' + this.querystring;
  } else {
    url += '?style=flat-square';
  }

  this.redirect(url);
};
