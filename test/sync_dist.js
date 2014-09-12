/**!
 * cnpmjs.org - test/sync_dist.js
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

var debug = require('debug');
debug.enable('cnpmjs.org*');
var co = require('co');
var syncdist = require('../sync/sync_dist');

var dir = process.argv[2] || '/v0.11.13/docs/api/';

co(function* () {
  yield* syncdist(dir);
  // yield* syncdist.syncPhantomjsDir();
})();
