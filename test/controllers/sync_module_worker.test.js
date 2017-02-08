'use strict';

const should = require('should');
const mm = require('mm');
const thunkify = require('thunkify-wrap');
const request = require('supertest');
const urllib = require('urllib');
const config = require('../../config');
const SyncModuleWorker = require('../../controllers/sync_module_worker');
const logService = require('../../services/module_log');
const packageService = require('../../services/package');
const utils = require('../utils');
const app = require('../../servers/registry');
const User = require('../../models').User;

describe('test/controllers/sync_module_worker.test.js', () => {
  afterEach(mm.restore);

  beforeEach(function() {
    mm(config, 'syncModel', 'all');
    mm(config, 'sourceNpmRegistryIsCNpm', false);
    mm(config, 'privatePackages', [ 'google' ]);
  });

  before(function(done) {
    mm(config, 'privatePackages', [ 'google' ]);
    const pkg = utils.getPackage('google', '0.0.1', utils.admin);
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  it('should not sync local package', function* () {
    const worker = new SyncModuleWorker({
      name: 'google',
      username: 'fengmk2',
    });
    worker.start();
    const end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should not sync private scoped package', function* () {
    const worker = new SyncModuleWorker({
      name: '@cnpmtest/google',
      username: 'fengmk2',
    });
    worker.start();
    const end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should sync public scoped package', function* () {
    mm(config, 'registryHost', '');
    mm(config, 'sourceNpmRegistry', 'https://registry.npmjs.org');
    let worker = new SyncModuleWorker({
      name: '@sindresorhus/df',
      username: 'fengmk2',
      noDep: true,
    });
    worker.start();
    let end = thunkify.event(worker, 'end');
    yield end();

    // sync again
    worker = new SyncModuleWorker({
      name: '@sindresorhus/df',
      username: 'fengmk2',
    });
    worker.start();
    end = thunkify.event(worker, 'end');
    yield end();

    let tgzUrl;
    function checkResult() {
      return function(done) {
        request(app.listen())
        .get('/@sindresorhus/df')
        .expect(function(res) {
          const latest = res.body.versions[res.body['dist-tags'].latest];
          tgzUrl = latest.dist.tarball;
        })
        .expect(200, done);
      };
    }

    yield checkResult();

    const r = yield urllib.request(tgzUrl);
    console.log(r.status, r.headers);
    r.status.should.equal(200);
  });

  it('should start a sync worker and dont sync deps', function* () {
    const log = yield logService.create({
      name: 'byte',
      username: 'fengmk2',
    });
    log.id.should.above(0);
    let worker = new SyncModuleWorker({
      logId: log.id,
      name: 'byte',
      username: 'fengmk2',
      noDep: true,
    });
    worker.start();
    setTimeout(function() {
      worker.add('pedding');
      worker.add('byte');
      worker.add('tair');
      worker.add('byte-not-exists');
    }, 10);
    let end = thunkify.event(worker, 'end');
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
    const log = yield logService.create({
      name: 'mk2testmodule',
      username: 'fengmk2',
    });
    const worker = new SyncModuleWorker({
      logId: log.id,
      name: 'mk2testmodule',
      username: 'fengmk2',
      noDep: true,
    });
    worker.start();
    const end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should start a sync worker with names and noDep', function(done) {
    const worker = new SyncModuleWorker({
      name: [ 'mk2testmodule' ],
      noDep: true,
      username: 'fengmk2',
    });

    worker.start();
    worker.on('end', function() {
      const names = worker.successes.concat(worker.fails);
      names.sort();
      names.should.eql([ 'mk2testmodule' ]);
      done();
    });
  });

  it('should start a sync worker with names', function(done) {
    const worker = new SyncModuleWorker({
      name: [ 'mk2testmodule' ],
      username: 'fengmk2',
    });

    worker.start();
    worker.on('end', done);
  });

  it('should sync unpublished module by name', function* () {
    const result = yield SyncModuleWorker.sync('tnpm', 'fengmk2');
    result.should.be.Number;
  });

  it('should sync not exists module', function* () {
    const result = yield SyncModuleWorker.sync('tnpm-not-exists', 'fengmk2');
    result.should.be.Number;
  });

  it('should sync unpublished info', function(done) {
    const worker = new SyncModuleWorker({
      name: [ 'tnpm' ],
      username: 'fengmk2',
    });

    worker.start();
    worker.on('end', function() {
      const names = worker.successes.concat(worker.fails);
      names.sort();
      names.should.eql([ 'tnpm' ]);
      done();
    });
  });

  it('should sync missing description, readme', function* () {
    const listModulesByName = packageService.listModulesByName;
    mm(packageService, 'listModulesByName', function* (name) {
      const mods = yield listModulesByName.call(packageService, name);
      mods.forEach(function(mod) {
        mod.description = null;
        mod.package.readme = '';
      });
      return mods;
    });

    const worker = new SyncModuleWorker({
      name: 'byte',
      username: 'fengmk2',
    });
    worker.start();
    const end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should delete not exists   version', function* () {
    const listModulesByName = packageService.listModulesByName;
    mm(packageService, 'listModulesByName', function* (name) {
      const mods = yield listModulesByName.call(packageService, name);
      if (mods[0]) {
        mods[0].version = '100.0.0';
      }
      return mods;
    });

    const worker = new SyncModuleWorker({
      name: 'byte',
      username: 'fengmk2',
      noDep: true,
    });
    worker.start();
    const end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should not sync unpublished info on local package', function* () {
    const listModulesByName = packageService.listModulesByName;
    mm(packageService, 'listModulesByName', function* () {
      const mods = yield listModulesByName.call(packageService, 'google');
      return mods;
    });

    const worker = new SyncModuleWorker({
      name: 'tnpm',
      username: 'fengmk2',
    });
    worker.start();
    const end = thunkify.event(worker, 'end');
    yield end();
  });

  it('should sync unpublished package', function* () {
    const listModulesByName = packageService.listModulesByName;
    mm(packageService, 'listModulesByName', function* () {
      const mods = yield listModulesByName.call(packageService, 'byte');
      return mods;
    });

    const worker = new SyncModuleWorker({
      name: 'tnpm',
      username: 'fengmk2',
    });
    worker.start();
    const end = thunkify.event(worker, 'end');
    yield end();
  });

  describe('syncUpstream()', function() {
    it('should sync upstream work', function* () {
      const worker = new SyncModuleWorker({
        name: [ 'tnpm' ],
        username: 'fengmk2',
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
        name: 'ms',
        username: 'fengmk2',
      });
      worker.start();
      const end = thunkify.event(worker, 'end');
      yield end();
    });

    it('should sync support un-deprecate action', function* () {
      const listModulesByName = packageService.listModulesByName;
      mm(packageService, 'listModulesByName', function* (name) {
        const mods = yield listModulesByName.call(packageService, name);
        mods.forEach(function(mod) {
          mod.package.deprecated = 'mock deprecated';
        });
        return mods;
      });

      const worker = new SyncModuleWorker({
        name: 'ms',
        username: 'fengmk2',
      });
      worker.start();
      const end = thunkify.event(worker, 'end');
      yield end();
      mm.restore();
      // check deprecated
      const mods = yield packageService.listModulesByName('ms');
      for (const mod of mods) {
        should.ok(mod.package.deprecated === undefined);
      }
    });
  });

  describe('sync user', function() {
    it('should sync fengmk2', function* () {
      const worker = new SyncModuleWorker({
        type: 'user',
        name: 'fengmk2',
        username: 'fengmk2',
      });
      worker.start();
      const end = thunkify.event(worker, 'end');
      yield end();
    });

    describe('sync deleted user', function() {
      before(function* () {
        let user = {
          name: 'notexistsuserscnpmtest',
          email: 'notexistsuserscnpmtest@gmail.com',
        };
        yield User.saveNpmUser(user);

        user = {
          name: 'existsuserscnpmtest',
          email: 'existsuserscnpmtest@gmail.com',
          password_sha: '0',
          salt: '0',
          ip: '127.0.0.1',
        };
        yield User.add(user);
      });

      it('should not delete when cnpm user exists', function* () {
        const worker = new SyncModuleWorker({
          type: 'user',
          name: 'existsuserscnpmtest',
          username: 'fengmk2',
        });
        worker.start();
        const end = thunkify.event(worker, 'end');
        yield end();
        const user = yield User.findByName('existsuserscnpmtest');
        should.exists(user);
        user.name.should.equal('existsuserscnpmtest');
      });

      it('should delete when user exists', function* () {
        const worker = new SyncModuleWorker({
          type: 'user',
          name: 'notexistsuserscnpmtest',
          username: 'fengmk2',
        });
        worker.start();
        const end = thunkify.event(worker, 'end');
        yield end();
        const user = yield User.findByName('notexistsuserscnpmtest');
        should.not.exists(user);
      });

      it('should not delete when user not exists', function* () {
        const worker = new SyncModuleWorker({
          type: 'user',
          name: 'notexistsuserscnpmtest',
          username: 'fengmk2',
        });
        worker.start();
        const end = thunkify.event(worker, 'end');
        yield end();
        const user = yield User.findByName('notexistsuserscnpmtest');
        should.not.exists(user);
      });
    });
  });
});
