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

var SyncModuleWorker = require('../proxy/sync_module_worker');
var mysql = require('../common/mysql');
var Log = require('../proxy/module_log');

var name = process.argv[2] || 'address,pedding';
var names = name.split(',');

Log.create({
  name: names[0],
  username: 'fengmk2',
}, function (err, result) {
  var worker = new SyncModuleWorker({
    logId: result.id,
    name: names,
    username: 'fengmk2',
    concurrency: names.length,
    noDep: true,
    publish: true,
  });

  worker.start();
  worker.on('end', function () {
    process.exit(0);
  });
});
