'use strict';

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('test/controllers/registry/package/show.test.js', function () {
  afterEach(mm.restore);

  before(function(done) {
    var pkg = utils.getPackage('@cnpmtest/testmodule-show', '0.0.1', utils.admin);
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, function(err) {
      should.not.exist(err);
      pkg = utils.getPackage('@cnpmtest/testmodule-show', '1.1.0', utils.admin);
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });
  });

  before(function(done) {
    var pkg = utils.getPackage('@cnpmtest/testmodule-only-beta', '1.0.0-beta.1', utils.admin);
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  it('should return one version', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show/0.0.1')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-show');
      data.version.should.equal('0.0.1');
      data['dist-tags'].should.eql({
        latest: '1.1.0',
      });
      data.dist.tarball.should.containEql('/@cnpmtest/testmodule-show/download/@cnpmtest/testmodule-show-0.0.1.tgz');
      data._cnpm_publish_time.should.equal(data.publish_time);
      done();
    });
  });

  it('should return max satisfied package with semver range', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show/^1.0.0')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-show');
      data.version.should.equal('1.1.0');
      data['dist-tags'].should.eql({
        latest: '1.1.0',
      });
      data.dist.tarball.should.containEql('/@cnpmtest/testmodule-show/download/@cnpmtest/testmodule-show-1.1.0.tgz');
      done();
    });
  });

  it('should return max satisfied package with complex semver range', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show/>1.2.0 <=2 || 0.0.1')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-show');
      data.version.should.equal('0.0.1');
      data['dist-tags'].should.eql({
        latest: '1.1.0',
      });
      data.dist.tarball.should.containEql('/@cnpmtest/testmodule-show/download/@cnpmtest/testmodule-show-0.0.1.tgz');
      done();
    });
  });

  it('should return max satisfied package with *', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show/*')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-show');
      data.version.should.equal('1.1.0');
      data['dist-tags'].should.eql({
        latest: '1.1.0',
      });
      data.dist.tarball.should.containEql('/@cnpmtest/testmodule-show/download/@cnpmtest/testmodule-show-1.1.0.tgz');
      done();
    });
  });

  it('should return the only beta version', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-only-beta/*')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-only-beta');
      data.version.should.equal('1.0.0-beta.1');
      data['dist-tags'].should.eql({
        latest: '1.0.0-beta.1',
      });
      data.dist.tarball.should.containEql('/@cnpmtest/testmodule-only-beta/download/@cnpmtest/testmodule-only-beta-1.0.0-beta.1.tgz');
      done();
    });
  });

  it('should support jsonp', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show/0.0.1?callback=jsonp')
    .expect(/jsonp\(\{/)
    .expect(200, done);
  });

  it('should return latest tag', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show/latest')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-show');
      data.version.should.equal('1.1.0');
      data['dist-tags'].should.eql({
        latest: '1.1.0',
      });
      done();
    });
  });

  it('should 404 when package not exist', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show-not-exists/latest')
    .expect(404, done);
  });

  it('should return scoped package one version', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show/0.0.1')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-show');
      data.version.should.equal('0.0.1');
      data['dist-tags'].should.eql({
        latest: '1.1.0',
      });
      done();
    });
  });

  it('should dont sync scoped package not exist', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show-not-exists/latest')
    .expect(404, done);
  });

  describe('show sync package', function () {
    before(function (done) {
      utils.sync('baidu', done);
    });

    it('should 200 when source npm exists', function (done) {
      request(app.listen())
      .get('/baidu/latest')
      .expect(200, done);
    });
  });
});
