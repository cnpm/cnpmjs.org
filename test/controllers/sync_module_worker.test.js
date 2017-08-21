'use strict';

var assert = require('assert');
var should = require('should');
var mm = require('mm');
var thunkify = require('thunkify-wrap');
var request = require('supertest');
var urllib = require('urllib');
var config = require('../../config');
var SyncModuleWorker = require('../../controllers/sync_module_worker');
var logService = require('../../services/module_log');
var packageService = require('../../services/package');
var utils = require('../utils');
var app = require('../../servers/registry');
var User = require('../../models').User;

describe('test/controllers/sync_module_worker.test.js', () => {
  afterEach(mm.restore);

  beforeEach(() => {
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

  it('should not sync private scoped package', function* () {
    var worker = new SyncModuleWorker({
      name: '@cnpmtest/google',
      username: 'fengmk2',
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should sync public scoped package', function* () {
    mm(config, 'registryHost', '');
    mm(config, 'sourceNpmRegistry', 'https://registry.npmjs.org');
    let envelope;
    mm(config, 'globalHook', function* (e) {
      envelope = e;
    });

    var worker = new SyncModuleWorker({
      name: '@sindresorhus/df',
      username: 'fengmk2',
      noDep: true,
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();
    assert(envelope);
    assert(envelope.event === 'package:sync');
    assert(envelope.name === '@sindresorhus/df');
    assert(envelope.payload.changedVersions.length > 0);

    // sync again
    var worker = new SyncModuleWorker({
      name: '@sindresorhus/df',
      username: 'fengmk2',
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();
    assert(envelope);
    assert(envelope.event === 'package:sync');
    assert(envelope.name === '@sindresorhus/df');
    assert(envelope.payload.changedVersions.length === 0);

    var tgzUrl;
    function checkResult() {
      return function (done) {
        request(app.listen())
        .get('/@sindresorhus/df')
        .expect(function (res) {
          var latest = res.body.versions[res.body['dist-tags']['latest']];
          tgzUrl = latest.dist.tarball;
        })
        .expect(200, done);
      };
    }

    yield checkResult();

    var r = yield urllib.request(tgzUrl);
    // console.log(r.status, r.headers);
    r.status.should.equal(200);
  });

  it('should start a sync worker and dont sync deps', function* () {
    var log = yield logService.create({
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
    var log = yield logService.create({
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
      assert(names.length >= 1 && names.length <= 2);
      // names.should.eql(['mk2testmodule', 'mk2testmodule']);
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
    var result = yield SyncModuleWorker.sync('tnpm', 'fengmk2');
    result.should.be.Number;
  });

  it('should sync not exists module', function* () {
    var result = yield SyncModuleWorker.sync('tnpm-not-exists', 'fengmk2');
    result.should.be.Number;
  });

  it('should sync unpublished info', function (done) {
    var worker = new SyncModuleWorker({
      name: ['afp'],
      username: 'fengmk2'
    });

    worker.start();
    worker.on('end', function () {
      var names = worker.successes.concat(worker.fails);
      names.sort();
      names.should.eql([ 'afp' ]);
      done();
    });
  });

  it('should sync missing description, readme', function* () {
    var listModulesByName = packageService.listModulesByName;
    mm(packageService, 'listModulesByName', function* (name) {
      var mods = yield listModulesByName.call(packageService, name);
      mods.forEach(function (mod) {
        mod.description = null;
        mod.package.readme = '';
      });
      return mods;
    });

    let envelope;
    mm(config, 'globalHook', function* (e) {
      envelope = e;
      // console.log(envelope);
    });
    var worker = new SyncModuleWorker({
      name: 'pedding',
      username: 'fengmk2',
      noDep: true,
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();
    assert(envelope);
    assert(envelope.name === 'pedding');
    assert(envelope.event === 'package:sync');
    assert(envelope.payload.changedVersions.length > 0);
  });

  it('should delete not exists   version', function* () {
    var listModulesByName = packageService.listModulesByName;
    mm(packageService, 'listModulesByName', function* (name) {
      var mods = yield listModulesByName.call(packageService, name);
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
      var mods = yield listModulesByName.call(packageService, 'google');
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
      var mods = yield listModulesByName.call(packageService, 'byte');
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

  it('should sync missing module abbreviateds deprecated property', function* () {
    var worker = new SyncModuleWorker({
      name: 'native-or-bluebird',
      username: 'fengmk2',
    });
    worker.start();
    var end = thunkify.event(worker, 'end');
    yield end();

    const rows = yield packageService.listModuleAbbreviatedsByName('native-or-bluebird');
    console.log('get %d rows', rows.length);
    rows.forEach(row => {
      assert(row.package.deprecated);
      assert(row.package._hasShrinkwrap === false);
    });

    // mock deprecated missing
    mm(packageService, 'listModuleAbbreviatedsByName', function* () {
      rows.forEach((row, index) => {
        if (index % 2 === 0) {
          row.package.deprecated = 'foo + ' + row.package.deprecated;
        } else {
          row.package.deprecated = undefined;
        }
      });
      return rows;
    });

    worker = new SyncModuleWorker({
      name: 'native-or-bluebird',
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

  describe('sync deprecated info', () => {
    before(function* () {
      mm(config, 'syncModel', 'all');
      const worker = new SyncModuleWorker({
        name: 'pedding',
        username: 'fengmk2',
        noDep: true,
      });
      worker.start();
      const end = thunkify.event(worker, 'end');
      yield end();
    });

    it('should sync support un-deprecate action', function* () {
      const listModulesByName = packageService.listModulesByName;
      mm(packageService, 'listModulesByName', function* (name) {
        const mods = yield listModulesByName.call(packageService, name);
        mods.forEach(function (mod) {
          mod.package.deprecated = 'mock deprecated';
        });
        return mods;
      });

      var worker = new SyncModuleWorker({
        name: 'pedding',
        username: 'fengmk2',
        noDep: true,
      });
      worker.start();
      const end = thunkify.event(worker, 'end');
      yield end();
      mm.restore();
      // check deprecated
      const mods = yield packageService.listModulesByName('pedding');
      for (const mod of mods) {
        should.ok(mod.package.deprecated === undefined);
      }
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

    describe('sync deleted user', function() {
      before(function*() {
        var user = {
          name: 'notexistsuserscnpmtest',
          email: 'notexistsuserscnpmtest@gmail.com',
        };
        yield User.saveNpmUser(user);

        var user = {
          name: 'existsuserscnpmtest',
          email: 'existsuserscnpmtest@gmail.com',
          password_sha: '0',
          salt: '0',
          ip: '127.0.0.1',
        };
        yield User.add(user);
      });

      it('should not delete when cnpm user exists', function*() {
        var worker = new SyncModuleWorker({
          type: 'user',
          name: 'existsuserscnpmtest',
          username: 'fengmk2',
        });
        worker.start();
        var end = thunkify.event(worker, 'end');
        yield end();
        var user = yield User.findByName('existsuserscnpmtest');
        should.exists(user);
        user.name.should.equal('existsuserscnpmtest');
      });

      it('should delete when user exists', function*() {
        var worker = new SyncModuleWorker({
          type: 'user',
          name: 'notexistsuserscnpmtest',
          username: 'fengmk2',
        });
        worker.start();
        var end = thunkify.event(worker, 'end');
        yield end();
        var user = yield User.findByName('notexistsuserscnpmtest');
        should.not.exists(user);
      });

      it('should not delete when user not exists', function*() {
        var worker = new SyncModuleWorker({
          type: 'user',
          name: 'notexistsuserscnpmtest',
          username: 'fengmk2',
        });
        worker.start();
        var end = thunkify.event(worker, 'end');
        yield end();
        var user = yield User.findByName('notexistsuserscnpmtest');
        should.not.exists(user);
      });
    });
  });
});
