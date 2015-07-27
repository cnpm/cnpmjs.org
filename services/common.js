/**!
 * cnpmjs.org - services/common.js
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

var config = require('../config');
var isPrivateScopedPackage = require('../lib/common').isPrivateScopedPackage;

config.privatePackages = config.privatePackages || [];

exports.isPrivatePackage = function (name) {
  if (isPrivateScopedPackage(name)) {
    return true;
  }
  if (config.privatePackages.indexOf(name) >= 0) {
    return true;
  }
  return false;
};
