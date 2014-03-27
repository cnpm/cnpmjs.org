/**!
 * cnpmjs.org - test/proxy/sync_module_worker.test.js
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

var should = require('should');
var SyncModuleWorker = require('../../proxy/sync_module_worker');
var mysql = require('../../common/mysql');
var Log = require('../../proxy/module_log');

describe('proxy/sync_module_worker.test.js', function () {
  it('should start a sync worker', function (done) {
    Log.create({
      name: 'cnpmjs.org',
      username: 'fengmk2',
    }, function (err, result) {
      should.not.exist(err);
      result.id.should.above(0);
      var worker = new SyncModuleWorker({
        logId: result.id,
        name: 'cnpmjs.org',
        username: 'fengmk2'
      });

      worker.start();
      worker.on('end', done);
    });
  });

  it('should start a sync worker with names and noDep', function (done) {
    var worker = new SyncModuleWorker({
      name: ['cnpmjs.org', 'cutter'],
      noDep: true,
      username: 'fengmk2'
    });

    worker.start();
    worker.on('end', function () {
      var names = worker.successes.concat(worker.fails);
      names.sort();
      names.should.eql(['cnpmjs.org', 'cutter']);
      done();
    });
  });

  it('should start a sync worker with names', function (done) {
    var worker = new SyncModuleWorker({
      name: ['cnpmjs.org', 'cutter'],
      username: 'fengmk2'
    });

    worker.start();
    worker.on('end', done);
  });
});
