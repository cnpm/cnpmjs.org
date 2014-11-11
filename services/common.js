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

config.privatePackages = config.privatePackages || [];

exports.isPrivatePackage = function* (name) {
  if (name[0] === '@') {
    return true;
  }
  if (config.privatePackages.indexOf(name) >= 0) {
    return true;
  }
  return false;
};
