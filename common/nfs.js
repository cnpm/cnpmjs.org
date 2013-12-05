/*!
 * cnpmjs.org - common/nfs.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var config = require('../config');
var nfs = config.nfs;

if (!nfs) {
  // use qnfs by default
  nfs = require('./qnfs');
}

module.exports = nfs;
