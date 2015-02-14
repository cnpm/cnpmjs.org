/**!
 * cnpmjs.org - test/sync.js
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

var debug = require('debug');
debug.enable('cnpmjs.org*');
var SyncModuleWorker = require('../controllers/sync_module_worker');
var config = require('../config');

// config.sourceNpmRegistry = 'https://registry.npmjs.org';

var names = process.argv[2] || 'enable';
names = names.split(',');

var worker = new SyncModuleWorker({
  name: names,
  username: 'fengmk2',
  concurrency: names.length,
  // noDep: true,
  // publish: true,
});

worker.start();
worker.on('end', function () {
  process.exit(0);
});
