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

var utility = require('utility');
var util = require('util');
var config = require('../../config');
var packageService = require('../../services/package');

exports.version = function* () {
  var color = 'lightgrey';
  var version = 'invalid';
  var name = this.params[0];
  var tag = this.query.tag || 'latest';
  var info = yield* packageService.getModuleByTag(name, tag);
  if (info) {
    version = info.version;
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
  var style = this.query.style || 'flat-square';
  var url = util.format('https://img.shields.io/badge/%s-%s-%s.svg?style=%s',
    subject, version, color, utility.encodeURIComponent(style));
  this.redirect(url);
};
