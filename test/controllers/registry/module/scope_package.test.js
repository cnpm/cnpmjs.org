/**!
 * cnpmjs.org - test/controllers/registry/module/scope_package.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

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

describe('controllers/registry/module/scope_package.test.js', function () {
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

  afterEach(mm.restore);

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
    .expect('Location', /\.tgz$/)
    .expect(302, done);
  });

  describe('support defaultScope', function () {
    before(function (done) {
      var pkg = utils.getPackage('test-default-scope-package', '0.0.1', utils.admin);
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });

    it('should adapt /@cnpm/test-default-scope-package => /test-default-scope-package', function (done) {
      mm(config, 'defaultScope', '@cnpm');
      request(app)
      .get('/@cnpm/test-default-scope-package')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var pkg = res.body;
        pkg._id.should.equal('@cnpm/test-default-scope-package');
        pkg.name.should.equal('@cnpm/test-default-scope-package');
        pkg.versions.should.have.keys('0.0.1');
        pkg['dist-tags'].latest.should.equal('0.0.1');
        pkg.versions['0.0.1'].name.should.equal('@cnpm/test-default-scope-package');
        pkg.versions['0.0.1']._id.should.equal('@cnpm/test-default-scope-package@0.0.1');
        pkg.versions['0.0.1'].dist.tarball
          .should.containEql('/test-default-scope-package/download/test-default-scope-package-0.0.1.tgz');
        done();
      });
    });

    it('should not adapt /@cnpm123/test-default-scope-package', function (done) {
      mm(config, 'defaultScope', '@cnpm');
      request(app)
      .get('/@cnpm123/test-default-scope-package')
      .expect(404, done);
    });

    it('should not adapt when defaultScope is empty', function (done) {
      mm(config, 'defaultScope', '');
      request(app)
      .get('/@cnpm/test-default-scope-package')
      .expect(404, done);
    });

    it('should 404 when pkg not exists', function (done) {
      mm(config, 'defaultScope', '@cnpm');
      request(app)
      .get('/@cnpm/test-default-scope-package-not-exists')
      .expect(404, done);
    });

    it('should 404 when scope not match', function (done) {
      mm(config, 'defaultScope', '@cnpm123');
      request(app)
      .get('/@cnpm/test-default-scope-package')
      .expect(404, done);
    });
  });
});
