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
var SyncModuleWorker = require('../proxy/sync_module_worker');
var mysql = require('../common/mysql');
var Log = require('../proxy/module_log');
var config = require('../config');

config.sourceNpmRegistry = 'http://registry.npm.taobao.org';

var names = process.argv[2] || 'byte';
names = names.split(',');

Log.create({
  name: names[0],
  username: 'fengmk2',
}, function (err, result) {
  if (err) {
    throw err;
  }
  var worker = new SyncModuleWorker({
    logId: result.id,
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
});
