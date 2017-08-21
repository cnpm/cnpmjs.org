'use strict';

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');
var config = require('../../../../config');
var packageService = require('../../../../services/package');
var nfs = require('../../../../common/nfs');

describe('test/controllers/registry/package/remove.test.js', function () {
  afterEach(mm.restore);

  before(function (done) {
    var pkg = utils.getPackage('@cnpmtest/testmodule-remove-1', '1.0.0', utils.otherUser);
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.otherUserAuth)
    .send(pkg)
    .expect(201, done);
  });

  it('should delete 401 when no auth', function (done) {
    request(app)
    .del('/@cnpmtest/testmodule-remove-1/-rev/1')
    .expect({
      error: 'unauthorized',
      reason: 'Login first'
    })
    .expect(401, done);
  });

  it('should 404 when package not exists', function (done) {
    request(app)
    .del('/@cnpmtest/testmodule-remove-1-not-exists/-rev/1')
    .set('authorization', utils.adminAuth)
    .expect({
      error: 'not_found',
      reason: 'document not found'
    })
    .expect(404, done);
  });

  it('should delete 403 when user is not admin', function (done) {
    request(app)
    .del('/@cnpmtest/testmodule-remove-1/-rev/1')
    .set('authorization', utils.otherUserAuth)
    .expect({
      error: 'no_perms',
      reason: 'Only administrators can unpublish module'
    })
    .expect(403, done);
  });

  it('should remove all versions ok', function (done) {
    request(app)
    .del('/@cnpmtest/testmodule-remove-1/-rev/1')
    .set('authorization', utils.adminAuth)
    .expect(200, function (err) {
      should.not.exist(err);
      request(app)
      .get('/@cnpmtest/testmodule-remove-1')
      .expect(404, done);
    });
  });

  describe('mock error', function () {
    beforeEach(function (done) {
      var pkg = utils.getPackage('@cnpmtest/testmodule-remove-mock-1', '2.0.0', utils.admin);
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });

    it('should mock key not exists', function (done) {
      var listModulesByName = packageService.listModulesByName;
      mm(packageService, 'listModulesByName', function* (name) {
        var mods = yield listModulesByName.call(packageService, name);
        mods.forEach(function (mod) {
          delete mod.package.dist.key;
        });
        return mods;
      });
      request(app)
      .del('/@cnpmtest/testmodule-remove-mock-1/-rev/1')
      .set('authorization', utils.adminAuth)
      .expect(200, function (err) {
        should.not.exist(err);
        request(app)
        .get('/@cnpmtest/testmodule-remove-mock-1')
        .expect(404, done);
      });
    });

    it('should mock nfs remove error', function (done) {
      mm(nfs, 'remove', function* () {
        throw new Error('mock nfs remove error');
      });
      request(app)
      .del('/@cnpmtest/testmodule-remove-mock-1/-rev/1')
      .set('authorization', utils.adminAuth)
      .expect(200, function (err) {
        should.not.exist(err);
        request(app)
        .get('/@cnpmtest/testmodule-remove-mock-1')
        .expect(404, done);
      });
    });
  });
});
