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
var mm = require('mm');
var SyncModuleWorker = require('../../proxy/sync_module_worker');
var mysql = require('../../common/mysql');
var Log = require('../../proxy/module_log');
var config = require('../../config');

describe('proxy/sync_module_worker.test.js', function () {
  afterEach(mm.restore);

  it('should start a sync worker', function (done) {
    Log.create({
      name: 'mk2testmodule',
      username: 'fengmk2',
    }, function (err, result) {
      should.not.exist(err);
      result.id.should.above(0);
      var worker = new SyncModuleWorker({
        logId: result.id,
        name: 'mk2testmodule',
        username: 'fengmk2'
      });

      worker.start();
      worker.on('end', done);
    });
  });

  it('should sync upstream first', function (done) {
    mm(config, 'sourceNpmRegistryIsCNpm', true);
    Log.create({
      name: 'mk2testmodule',
      username: 'fengmk2',
    }, function (err, result) {
      should.not.exist(err);
      result.id.should.above(0);
      var worker = new SyncModuleWorker({
        logId: result.id,
        name: 'mk2testmodule',
        username: 'fengmk2'
      });

      worker.start();
      worker.on('end', done);
    });
  });

  it('should start a sync worker with names and noDep', function (done) {
    var worker = new SyncModuleWorker({
      name: ['mk2testmodule'],
      noDep: true,
      username: 'fengmk2'
    });

    worker.start();
    worker.on('end', function () {
      var names = worker.successes.concat(worker.fails);
      names.sort();
      names.should.eql(['mk2testmodule']);
      done();
    });
  });

  it('should start a sync worker with names', function (done) {
    var worker = new SyncModuleWorker({
      name: ['mk2testmodule'],
      username: 'fengmk2'
    });

    worker.start();
    worker.on('end', done);
  });

  it('should sync unpublished module by name', function* () {
    var result = yield* SyncModuleWorker.sync('tnpm', 'fengmk2');
    result.should.be.Number;
  });

  it('should sync not exists module', function* () {
    var result = yield* SyncModuleWorker.sync('tnpm-not-exists', 'fengmk2');
    result.should.be.Number;
  });

  it('should sync unpublished info', function (done) {
    var worker = new SyncModuleWorker({
      name: ['tnpm'],
      username: 'fengmk2'
    });

    worker.start();
    worker.on('end', function () {
      var names = worker.successes.concat(worker.fails);
      names.sort();
      names.should.eql(['tnpm']);
      done();
    });
  });

  describe('syncUpstream()', function () {
    it('should sync upstream work', function* () {
      var worker = new SyncModuleWorker({
        name: ['tnpm'],
        username: 'fengmk2'
      });
      yield [
        worker.syncUpstream('tnpm'),
        worker.syncUpstream('pedding'),
      ];
    });
  });
});
