'use strict';

var assert = require('assert');
var should = require('should');
var request = require('supertest');
var pedding = require('pedding');
var mm = require('mm');
var packageService = require('../../../../services/package');
var app = require('../../../../servers/registry');
var config = require('../../../../config');
var utils = require('../../../utils');

describe('test/controllers/registry/package/save.test.js', function () {
  afterEach(mm.restore);

  describe('no @scoped package', function () {
    beforeEach(function () {
      mm(config, 'syncModel', 'all');
      mm(config, 'privatePackages', ['testmodule-new-1', 'testmodule-new-2', 'testmodule-no-latest']);
    });

    before(function (done) {
      mm(config, 'privatePackages', ['testmodule-new-1', 'testmodule-new-2']);
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].dependencies = {
        'bytetest-1': '~0.0.1',
        mocha: '~1.0.0'
      };
      request(app.listen())
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
        request(app.listen())
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, done);
      });
    });

    it('should publish new version package and save dependencies', function (done) {
      request(app.listen())
      .get('/testmodule-new-1')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var data = res.body;
        data.name.should.equal('testmodule-new-1');
        Object.keys(data.versions).should.eql(['0.0.1']);
        data.versions['0.0.1'].dependencies.should.eql({
          'bytetest-1': '~0.0.1',
          mocha: '~1.0.0'
        });
        done();
      });
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
      request(app.listen())
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
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err) {
        should.not.exist(err);

        request(app.listen())
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
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err) {
        should.not.exist(err);

        request(app.listen())
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
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: 'version_error',
        reason: 'package.versions is empty'
      })
      .expect(400, done);
    });

    it('should 400 when maintainers missing', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      delete pkg.versions['0.0.1'].maintainers;
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: 'maintainers error',
        reason: 'request body need maintainers'
      })
      .expect(400, done);
    });

    it('should 400 when dist-tags missing', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      delete pkg['dist-tags'];
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: 'invalid',
        reason: 'dist-tags should not be empty'
      })
      .expect(400, done);
    });

    it('should 403 when maintainers dont contain current user', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].maintainers[0].name += '-testuser';
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: 'maintainers error',
        reason: utils.admin + ' does not in maintainer list'
      })
      .expect(403, done);
    });

    it('should 400 when attachments missing', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      delete pkg._attachments;
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: 'attachment_error',
        reason: 'package._attachments is empty'
      })
      .expect(400, done);
    });

    it('should 403 when attachments length wrong', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.3', utils.admin);
      pkg._attachments[Object.keys(pkg._attachments)[0]].length += 10;
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: 'size_wrong',
        reason: 'Attachment size 261 not match download size 251'
      })
      .expect(403, done);
    });

    it('should 403 when user is not maintainer', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.2', utils.otherAdmin2);
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.otherAdmin2Auth)
      .send(pkg)
      .expect({
        error: 'forbidden user',
        reason: 'cnpmjstestAdmin2 not authorized to modify testmodule-new-1, please contact maintainers: cnpmjstest10'
      })
      .expect(403, done);
    });

    it('should 403 when version exists', function (done) {
      var pkg = utils.getPackage('testmodule-new-1', '0.0.1', utils.admin);
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect({
        error: 'forbidden',
        reason: 'cannot modify pre-existing version: 0.0.1'
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
      request(app.listen())
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
        request(app.listen())
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, done);
      });
    });

    it('should publish new version package and save dependencies', function (done) {
      request(app.listen())
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
