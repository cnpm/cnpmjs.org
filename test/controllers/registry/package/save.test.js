'use strict';

var assert = require('assert');
var should = require('should');
var request = require('supertest');
var pedding = require('pedding');
var mm = require('mm');
var packageService = require('../../../../services/package');
var tokenService = require('../../../../services/token');
var app = require('../../../../servers/registry');
var config = require('../../../../config');
var utils = require('../../../utils');

describe('test/controllers/registry/package/save.test.js', () => {
  afterEach(mm.restore);

  describe('no @scoped package', function () {
    beforeEach(function () {
      mm(config, 'syncModel', 'all');
      mm(config, 'privatePackages', ['testmodule-new-1', 'testmodule-new-2', 'testmodule-no-latest', 'testmodule-new-4']);
    });

    before(function (done) {
      mm(config, 'privatePackages', ['testmodule-new-1', 'testmodule-new-2']);
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].dependencies = {
        'bytetest-1': '~0.0.1',
        mocha: '~1.0.0'
      };
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err) {
        should.not.exist(err);
        var pkg = utils.getPackage('testmodule-new-2', '1.0.0', utils.admin);
        pkg.versions['1.0.0'].dependencies = {
          'bytetest-1': '~0.0.1',
          mocha: '~1.0.0'
        };
        request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, done);
      });
    });

    it('should publish new version package and save dependencies', done => {
      request(app)
      .get('/testmodule-new-1')
      .expect(200, function (err, res) {
        assert(!err);
        var data = res.body;
        assert(data.name === 'testmodule-new-1');
        assert.deepStrictEqual(Object.keys(data.versions), ['0.0.1']);
        assert.deepStrictEqual(data.versions['0.0.1'].dependencies, {
          'bytetest-1': '~0.0.1',
          mocha: '~1.0.0'
        });
        // should has integrity with sha512
        assert(data.versions['0.0.1'].dist.integrity === 'sha512-n+4CQg0Rp1Qo0p9a0R5E5io67T9iD3Lcgg6exmpmt0s8kd4XcOoHu2kiu6U7xd69cGq0efkNGWUBP229ObfRSA==');
        assert(data.versions['0.0.1'].dist.shasum === 'fa475605f88bab9b1127833633ca3ae0a477224c');
        done();
      });
    });

    it('should publish error on shasum invaild', done => {
      mm(config, 'privatePackages', ['testmodule-new-1']);
      var pkg = utils.getPackage('testmodule-new-1', '0.0.88', utils.admin);
      pkg.versions['0.0.88'].dependencies = {
        'bytetest-1': '~0.0.1',
        mocha: '~1.0.0'
      };
      pkg.versions['0.0.88'].dist.shasum = 'fa475605f88bab9b1127833633ca3ae0a47wrong';
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(400, function (err, res) {
        assert(!err);
        assert(res.body.error === '[invalid] dist.shasum invalid');
        assert(res.body.reason === '[invalid] dist.shasum invalid');
        done();
      });
    });

    it('should publish error on integrity invaild', done => {
      mm(config, 'privatePackages', ['testmodule-new-1']);
      var pkg = utils.getPackage('testmodule-new-1', '0.0.88', utils.admin);
      pkg.versions['0.0.88'].dependencies = {
        'bytetest-1': '~0.0.1',
        mocha: '~1.0.0'
      };
      pkg.versions['0.0.88'].dist.integrity = 'sha512-n+4CQg0Rp1Qo0p9a0R5E5io67T9iD3Lcgg6exmpmt0s8kd4XcOoHu2kiu6U7xd69cGq0efkNGWUBP229ObfBBB==';
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(400, function (err, res) {
        assert(!err);
        assert(res.body.error === '[invalid] dist.integrity invalid');
        assert(res.body.reason === '[invalid] dist.integrity invalid');
        done();
      });
    });

    it('should publish success with integrity and shasum', done => {
      mm(config, 'privatePackages', ['testmodule-new-1']);
      var pkg = utils.getPackage('testmodule-new-1', '0.0.88', utils.admin);
      pkg.versions['0.0.88'].dependencies = {
        'bytetest-1': '~0.0.1',
        mocha: '~1.0.0'
      };
      pkg.versions['0.0.88'].dist.integrity = 'sha512-n+4CQg0Rp1Qo0p9a0R5E5io67T9iD3Lcgg6exmpmt0s8kd4XcOoHu2kiu6U7xd69cGq0efkNGWUBP229ObfRSA==';
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });

    it('should publish success with integrity and without shasum', done => {
      mm(config, 'privatePackages', ['testmodule-new-1']);
      var pkg = utils.getPackage('testmodule-new-1', '0.0.881', utils.admin);
      pkg.versions['0.0.881'].dependencies = {
        'bytetest-1': '~0.0.1',
        mocha: '~1.0.0'
      };
      pkg.versions['0.0.881'].dist.integrity = 'sha512-n+4CQg0Rp1Qo0p9a0R5E5io67T9iD3Lcgg6exmpmt0s8kd4XcOoHu2kiu6U7xd69cGq0efkNGWUBP229ObfRSA==';
      delete pkg.versions['0.0.881'].dist;
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });

    it('should publish success without integrity and without shasum', done => {
      mm(config, 'privatePackages', ['testmodule-new-1']);
      var pkg = utils.getPackage('testmodule-new-1', '0.0.882', utils.admin);
      pkg.versions['0.0.882'].dependencies = {
        'bytetest-1': '~0.0.1',
        mocha: '~1.0.0'
      };
      delete pkg.versions['0.0.882'].dist.integrity;
      delete pkg.versions['0.0.882'].dist;
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });

    it('should publish new package and fire globalHook', done => {
      done = pedding(done, 2);
      mm(config, 'globalHook', function* (envelope) {
        console.log(envelope);
        assert(envelope.version === '1.0.1');
        assert(envelope.name === 'testmodule-new-2');
        assert(envelope.type === 'package');
        assert(envelope.event === 'package:publish');
        done();
      });
      var pkg = utils.getPackage('testmodule-new-2', '1.0.1', utils.admin);
      pkg.versions['1.0.1'].dependencies = {
        'bytetest-1': '~0.0.1',
        mocha: '~1.0.0'
      };
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });

    it('should save dependents', function* () {
      var names = yield packageService.listDependents('bytetest-1');
      names.should.length(2);
      names.should.eql(['testmodule-new-1', 'testmodule-new-2']);

      names = yield packageService.listDependents('testmodule-new-1');
      names.should.length(0);
    });

    it('should auto add latest tag when it not exists', function (done) {
      var pkg = utils.getPackage('testmodule-no-latest', '0.0.1', utils.admin);
      var tags = pkg['dist-tags'];
      tags.v2 = tags.latest;
      delete tags.latest;
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err) {
        should.not.exist(err);

        request(app)
        .get('/' + pkg.name)
        .expect(200, function (err, res) {
          should.not.exist(err);
          var data = res.body;
          data['dist-tags'].should.eql({
            latest: '0.0.1',
            v2: '0.0.1'
          });
          done();
        });
      });
    });

    it('should publish with tag', function (done) {
      var pkg = utils.getPackage('testmodule-no-latest', '0.0.2', utils.admin);
      var tags = pkg['dist-tags'];
      tags.v2 = tags.latest;
      delete tags.latest;
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err) {
        should.not.exist(err);

        request(app)
        .get('/' + pkg.name)
        .expect(200, function (err, res) {
          should.not.exist(err);
          var data = res.body;
          data['dist-tags'].should.eql({
            latest: '0.0.1',
            v2: '0.0.2'
          });
          done();
        });
      });
    });

    it('should 400 when versions missing', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      delete pkg.versions;
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: '[version_error] package.versions is empty',
        reason: '[version_error] package.versions is empty',
      })
      .expect(400, done);
    });

    it('should 400 when maintainers missing', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      delete pkg.versions['0.0.1'].maintainers;
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: '[maintainers_error] request body need maintainers',
        reason: '[maintainers_error] request body need maintainers',
      })
      .expect(400, done);
    });

    it('should publish use token', function* () {
      var token = yield tokenService.createToken(utils.admin);

      var pkg = utils.getPackageWithToken('testmodule-new-3', '0.0.1', utils.admin);

      yield request(app)
        .put('/' + pkg.name)
        .set('authorization', 'Bearer ' + token.token)
        .send(pkg)
        .expect(201);

      yield tokenService.deleteToken(utils.admin, token.token);
    });

    it('should 400 when dist-tags missing', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      delete pkg['dist-tags'];
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: '[invalid] dist-tags should not be empty',
        reason: '[invalid] dist-tags should not be empty',
      })
      .expect(400, done);
    });

    it('should 403 when maintainers dont contain current user', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].maintainers[0].name += '-testuser';
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: '[maintainers_error] ' + utils.admin + ' does not in maintainer list',
        reason: '[maintainers_error] ' + utils.admin + ' does not in maintainer list'
      })
      .expect(403, done);
    });

    it('should publish when maintainers dont contain current user in token mode', function* () {
      var token = yield tokenService.createToken(utils.admin);

      var pkg = utils.getPackage('testmodule-new-4', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].maintainers[0].name += '-testuser';

      yield request(app)
        .put('/' + pkg.name)
        .set('authorization', 'Bearer ' + token.token)
        .send(pkg)
        .expect(201);

      yield tokenService.deleteToken(utils.admin, token.token);

      var maintainers = yield packageService.listMaintainers(pkg.name);
      maintainers.should.eql([{
        name: 'cnpmjstest10',
        email: 'fengmk2@gmail.com',
      }]);
    });

    it('should 400 when attachments missing', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      delete pkg._attachments;
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: '[attachment_error] package._attachments is empty',
        reason: '[attachment_error] package._attachments is empty',
      })
      .expect(400, done);
    });

    it('should 403 when attachments length wrong', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.3', utils.admin);
      pkg._attachments[Object.keys(pkg._attachments)[0]].length += 10;
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: '[size_wrong] Attachment size 261 not match download size 251',
        reason: '[size_wrong] Attachment size 261 not match download size 251',
      })
      .expect(403, done);
    });

    it('should 403 when user is not maintainer', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.2', utils.otherAdmin2);
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.otherAdmin2Auth)
      .send(pkg)
      .expect({
        error: '[forbidden] cnpmjstestAdmin2 not authorized to modify testmodule-new-1, please contact maintainers: cnpmjstest10',
        reason: '[forbidden] cnpmjstestAdmin2 not authorized to modify testmodule-new-1, please contact maintainers: cnpmjstest10',
      })
      .expect(403, done);
    });

    it('should 403 when version exists', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: '[forbidden] cannot modify pre-existing version: 0.0.1',
        reason: '[forbidden] cannot modify pre-existing version: 0.0.1',
      })
      .expect(403, done);
    });
  });

  describe('@scoped package', function () {
    before(function (done) {
      var pkg = utils.getPackage('@cnpmtest/testmodule-new-1', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].dependencies = {
        bytetest2: '~0.0.1',
        mocha: '~1.0.0'
      };
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err) {
        should.not.exist(err);
        var pkg = utils.getPackage('@cnpmtest/testmodule-new-2', '1.0.0', utils.admin);
        pkg.versions['1.0.0'].dependencies = {
          bytetest2: '~0.0.1',
          mocha: '~1.0.0'
        };
        request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, done);
      });
    });

    it('should publish new version package and save dependencies', function (done) {
      request(app)
      .get('/@cnpmtest/testmodule-new-1')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var data = res.body;
        data.name.should.equal('@cnpmtest/testmodule-new-1');
        Object.keys(data.versions).should.eql(['0.0.1']);
        data.versions['0.0.1'].dependencies.should.eql({
          bytetest2: '~0.0.1',
          mocha: '~1.0.0'
        });
        done();
      });
    });

    it('should save dependents', function* () {
      var names = yield packageService.listDependents('bytetest2');
      names.should.length(2);
      names.should.eql(['@cnpmtest/testmodule-new-1', '@cnpmtest/testmodule-new-2']);

      names = yield packageService.listDependents('@cnpmtest/testmodule-new-1');
      names.should.length(0);
    });
  });
});
