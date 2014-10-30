/**!
 * cnpmjs.org - test/init.js
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

if (process.env.DB) {
  config.database.dialect = process.env.DB;
}

if (process.env.CNPM_SOURCE_NPM) {
  config.sourceNpmRegistry = process.env.CNPM_SOURCE_NPM;
}
if (process.env.CNPM_SOURCE_NPM_ISCNPM === 'false') {
  config.sourceNpmRegistryIsCNpm = false;
}
