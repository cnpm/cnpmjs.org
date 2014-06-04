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

co(function* () {
  // yield* syncdist('/v0.10.28/');
  yield* syncdist.syncPhantomjsDir();
})();
