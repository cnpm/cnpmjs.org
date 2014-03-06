/**!
 * cnpmjs.org - dispatch.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var path = require('path');
var util = require('util');
var cluster = require('cluster');
var config = require('./config');
var workerPath = path.join(__dirname, 'worker.js');
var childProcess = require('child_process');
var syncPath = path.join(__dirname, 'sync');

if (config.enableCluster) {
  cluster.setupMaster({
    exec: workerPath
  });

  cluster.on('fork', function (worker) {
    console.log('[%s] [worker:%d] new worker start', new Date(), worker.process.pid);
  });

  cluster.on('disconnect', function (worker) {
    var w = cluster.fork();
    console.error('[%s] [master:%s] wroker:%s disconnect! new worker:%s fork',
      new Date(), process.pid, worker.process.pid, w.process.pid);
  });

  cluster.on('exit', function (worker, code, signal) {
    var exitCode = worker.process.exitCode;
    var err = new Error(util.format('worker %s died (code: %s, signal: %s)', worker.process.pid, exitCode, signal));
    err.name = 'WorkerDiedError';
    console.error(err);
  });

  var numCPUs = require('os').cpus().length;
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  childProcess.fork(syncPath);
} else {
  require(workerPath);
  require(syncPath);
}
