/**!
 * cnpmjs.org - test/controllers/registry/sync_module_worker.js
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

var SyncModuleWorker = require('../../../controllers/registry/sync_module_worker');
var mysql = require('../../../common/mysql');
var Log = require('../../../proxy/module_log');

var name = process.argv[2] || 'address';

Log.create({
  name: name,
  username: 'fengmk2',
}, function (err, result) {
  var worker = new SyncModuleWorker({
    logId: result.id,
    name: name,
    username: 'fengmk2'
  });

  worker.start();
  worker.on('end', function () {
    process.exit(0);
  });

  // mysql.query('delete from module where name=?', [name], function () {
  //   worker.start();
  //   worker.on('end', function () {
  //     process.exit(0);
  //   });
  // });
});
