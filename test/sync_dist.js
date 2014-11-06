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
var config = require('../config');
var DistSyncer = require('../sync/sync_dist');

var dir = process.argv[2] || '/v0.11.14/docs/api/';

co(function* () {
  var distsyncer = new DistSyncer({
    disturl: config.disturl
  });
  // yield* distsyncer.syncPhantomjsDir();
  yield* distsyncer.start(dir);

  yield* new DistSyncer({
    disturl: config.pythonDisturl
  }).start('/python/3.4.2/');
})();
