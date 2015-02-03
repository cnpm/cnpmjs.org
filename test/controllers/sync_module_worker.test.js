/**!
 * cnpmjs.org - test/controllers/sync_module_worker.test.js
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

var mm = require('mm');
var thunkify = require('thunkify-wrap');
var request = require('supertest');
var config = require('../../config');
var SyncModuleWorker = require('../../controllers/sync_module_worker');
var logService = require('../../services/module_log');
var packageService = require('../../services/package');
var utils = require('../utils');
var app = require('../../servers/registry');

describe('controllers/sync_module_worker.test.js', function () {
  afterEach(mm.restore);

  beforeEach(function () {
    mm(config, 'syncModel', 'all');
    mm(config, 'sourceNpmRegistryIsCNpm', false);
    mm(config, 'privatePackages', ['google']);
  });

  before(function (done) {
    mm(config, 'privatePackages', ['google']);
    var pkg = utils.getPackage('google', '0.0.1', utils.admin);
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  it('should not sync local package', function* () {
    var worker = new SyncModuleWorker({
      name: 'google',
      username: 'fengmk2',
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should not sync scoped package', function* () {
    var worker = new SyncModuleWorker({
      name: '@scoped/google',
      username: 'fengmk2',
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should start a sync worker and dont sync deps', function* () {
    var log = yield* logService.create({
      name: 'byte',
      username: 'fengmk2',
    });
    log.id.should.above(0);
    var worker = new SyncModuleWorker({
      logId: log.id,
      name: 'byte',
      username: 'fengmk2',
      noDep: true,
    });
    worker.start();
    setTimeout(function () {
      worker.add('pedding');
      worker.add('byte');
      worker.add('tair');
      worker.add('byte-not-exists');
    }, 10);
    var end = thunkify.event(worker, 'end');
    yield end();

    // sync again
    worker = new SyncModuleWorker({
      logId: log.id,
      name: 'byte',
      username: 'fengmk2',
    });
    worker.start();
    end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should sync upstream first', function* () {
    mm(config, 'sourceNpmRegistryIsCNpm', true);
    var log = yield* logService.create({
      name: 'mk2testmodule',
      username: 'fengmk2',
    });
    var worker = new SyncModuleWorker({
      logId: log.id,
      name: 'mk2testmodule',
      username: 'fengmk2',
      noDep: true,
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();
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

  it('should sync missing description, readme', function* () {
    var listModulesByName = packageService.listModulesByName;
    mm(packageService, 'listModulesByName', function* (name) {
      var mods = yield* listModulesByName.call(packageService, name);
      mods.forEach(function (mod) {
        mod.description = null;
        mod.package.readme = '';
      });
      return mods;
    });

    var worker = new SyncModuleWorker({
      name: 'byte',
      username: 'fengmk2',
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should delete not exists   version', function* () {
    var listModulesByName = packageService.listModulesByName;
    mm(packageService, 'listModulesByName', function* (name) {
      var mods = yield* listModulesByName.call(packageService, name);
      if (mods[0]) {
        mods[0].version = '100.0.0';
      }
      return mods;
    });

    var worker = new SyncModuleWorker({
      name: 'byte',
      username: 'fengmk2',
      noDep: true,
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should not sync unpublished info on local package', function* () {
    var listModulesByName = packageService.listModulesByName;
    mm(packageService, 'listModulesByName', function* () {
      var mods = yield* listModulesByName.call(packageService, 'google');
      return mods;
    });

    var worker = new SyncModuleWorker({
      name: 'tnpm',
      username: 'fengmk2',
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should sync unpublished package', function* () {
    var listModulesByName = packageService.listModulesByName;
    mm(packageService, 'listModulesByName', function* () {
      var mods = yield* listModulesByName.call(packageService, 'byte');
      return mods;
    });

    var worker = new SyncModuleWorker({
      name: 'tnpm',
      username: 'fengmk2',
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();
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

  describe('sync user', function () {
    it('should sync fengmk2', function* () {
      var worker = new SyncModuleWorker({
        type: 'user',
        name: 'fengmk2',
        username: 'fengmk2',
      });
      worker.start();
      var end = thunkify.event(worker, 'end');
      yield end();
    });
  });
});
