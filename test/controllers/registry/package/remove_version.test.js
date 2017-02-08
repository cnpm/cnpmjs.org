'use strict';

const should = require('should');
const request = require('supertest');
const mm = require('mm');
const app = require('../../../../servers/registry');
const utils = require('../../../utils');
const packageService = require('../../../../services/package');

describe('controllers/registry/package/remove_version.test.js', function() {
  afterEach(mm.restore);

  let lastRev;
  before(function(done) {
    const pkg = utils.getPackage('@cnpmtest/testmodule-remove_version-1', '0.0.1', utils.otherUser);
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.otherUserAuth)
    .send(pkg)
    .expect(201, function(err, res) {
      should.not.exist(err);
      lastRev = res.body.rev;
      done();
    });
  });

  it('should 404 when version format error', function(done) {
    request(app)
    .del('/@cnpmtest/testmodule-remove_version-1/download/@cnpmtest/testmodule_remove_version123.tgz/-rev/112312312321')
    .set('authorization', utils.adminAuth)
    .expect({
      error: 'not_found',
      reason: 'document not found',
    })
    .expect(404, done);
  });

  it('should 404 when rev format error', function(done) {
    request(app)
    .del('/@cnpmtest/testmodule-remove_version-1/download/@cnpmtest/testmodule-remove_version-1-1.0.1.tgz/-rev/abc')
    .set('authorization', utils.adminAuth)
    .expect({
      error: 'not_found',
      reason: 'document not found',
    })
    .expect(404, done);
  });

  it('should 404 when version not exists', function(done) {
    request(app)
    .del('/@cnpmtest/testmodule-remove_version-1/download/@cnpmtest/testmodule-remove_version-1-1.0.1.tgz/-rev/112312312321')
    .set('authorization', utils.adminAuth)
    .expect({
      error: 'not_found',
      reason: 'document not found',
    })
    .expect(404, done);
  });

  it('should 401 when no auth', function(done) {
    request(app)
    .del('/@cnpmtest/testmodule-remove_version-1/download/@cnpmtest/testmodule-remove_version-1-0.0.1.tgz/-rev/' + lastRev)
    .expect(401, done);
  });

  it('should 403 when not admin', function(done) {
    request(app)
    .del('/@cnpmtest/testmodule-remove_version-1/download/@cnpmtest/testmodule-remove_version-1-0.0.1.tgz/-rev/' + lastRev)
    .set('authorization', utils.otherUserAuth)
    .expect(403, done);
  });

  it('should 200 when delete success', function(done) {
    request(app)
    .del('/@cnpmtest/testmodule-remove_version-1/download/@cnpmtest/testmodule-remove_version-1-0.0.1.tgz/-rev/' + lastRev)
    .set('authorization', utils.adminAuth)
    .expect(200, done);
  });

  describe('mock error', function() {
    before(function(done) {
      const pkg = utils.getPackage('@cnpmtest/testmodule-remove_version-1', '0.0.2', utils.otherUser);
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.otherUserAuth)
      .send(pkg)
      .expect(201, done);
    });

    it('should auto add cdn key', function(done) {
      const getModule = packageService.getModule;
      mm(packageService, 'getModule', function* (name, version) {
        const mod = yield getModule.call(packageService, name, version);
        delete mod.package.dist.key;
        return mod;
      });

      request(app)
      .del('/@cnpmtest/testmodule-remove_version-1/download/@cnpmtest/testmodule-remove_version-1-0.0.2.tgz/-rev/' + lastRev)
      .set('authorization', utils.adminAuth)
      .expect(200, done);
    });
  });
});
