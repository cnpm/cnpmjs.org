'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var config = require('../../../../config');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('test/controllers/registry/module/scope_package.test.js', function () {
  var pkgname = '@cnpm/test-scope-package';
  var pkgURL = '/@' + encodeURIComponent(pkgname.substring(1));
  before(function (done) {
    app = app.listen(0, function () {
      // add scope package
      var pkg = utils.getPackage(pkgname, '0.0.1', utils.admin);

      request(app)
      .put(pkgURL)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err) {
        should.not.exist(err);
        pkg = utils.getPackage(pkgname, '0.0.2', utils.admin);
        // publish 0.0.2
        request(app.listen())
        .put(pkgURL)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, done);
      });
    });
  });

  beforeEach(function () {
    mm(config, 'scopes', ['@cnpm', '@cnpmtest']);
  });

  afterEach(mm.restore);

  it('should get 302 when do not support scope', function (done) {
    mm(config, 'scopes', []);
    request(app)
    .get('/@invalid/test')
    .expect('Location', 'https://registry.npmjs.com/@invalid/test')
    .expect(302, done);
  });

  it('should get 404 when scope is private', function (done) {
    request(app)
    .get('/@cnpmtest/test')
    .expect(404, done);
  });

  it('should get scope package info: /@scope%2Fname', function (done) {
    request(app)
    .get(pkgURL)
    .expect(200, function (err, res) {
      should.not.exist(err);
      var pkg = res.body;
      pkg.name.should.equal(pkgname);
      pkg.versions.should.have.keys('0.0.1', '0.0.2');
      pkg['dist-tags'].latest.should.equal('0.0.2');
      pkg.versions['0.0.1'].name.should.equal(pkgname);
      pkg.versions['0.0.1'].dist.tarball
        .should.containEql('/@cnpm/test-scope-package/download/@cnpm/test-scope-package-0.0.1.tgz');
      done();
    });
  });

  it('should get scope package info: /@scope/name', function (done) {
    request(app.listen())
    .get('/' + pkgname)
    .expect(200, function (err, res) {
      should.not.exist(err);
      var pkg = res.body;
      pkg.name.should.equal(pkgname);
      pkg.versions.should.have.keys('0.0.1', '0.0.2');
      pkg['dist-tags'].latest.should.equal('0.0.2');
      pkg.versions['0.0.1'].name.should.equal(pkgname);
      pkg.versions['0.0.1'].dist.tarball
        .should.containEql('/@cnpm/test-scope-package/download/@cnpm/test-scope-package-0.0.1.tgz');
      done();
    });
  });

  it('should get scope package info: /%40scope%2Fname', function (done) {
    request(app)
    .get('/' + encodeURIComponent(pkgname))
    .expect(200, function (err, res) {
      should.not.exist(err);
      var pkg = res.body;
      pkg.name.should.equal(pkgname);
      pkg.versions.should.have.keys('0.0.1', '0.0.2');
      pkg['dist-tags'].latest.should.equal('0.0.2');
      pkg.versions['0.0.1'].name.should.equal(pkgname);
      pkg.versions['0.0.1'].dist.tarball
        .should.containEql('/@cnpm/test-scope-package/download/@cnpm/test-scope-package-0.0.1.tgz');
      done();
    });
  });

  it('should get scope package with version', function (done) {
    request(app)
    .get('/' + pkgname + '/0.0.1')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var pkg = res.body;
      pkg.name.should.equal(pkgname);
      pkg.version.should.equal('0.0.1');
      pkg.dist.tarball
        .should.containEql('/@cnpm/test-scope-package/download/@cnpm/test-scope-package-0.0.1.tgz');
      done();
    });
  });

  it('should get scope package with tag', function (done) {
    request(app)
    .get('/' + pkgname + '/latest')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var pkg = res.body;
      pkg.name.should.equal(pkgname);
      pkg.version.should.equal('0.0.2');
      pkg.dist.tarball
        .should.containEql('/@cnpm/test-scope-package/download/@cnpm/test-scope-package-0.0.2.tgz');
      done();
    });
  });

  it('should download work', function (done) {
    request(app)
    .get('/@cnpm/test-scope-package/download/@cnpm/test-scope-package-0.0.2.tgz')
    .expect(200, done);
  });
});
