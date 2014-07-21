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
var app = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('controllers/registry/module/scope_package.test.js', function () {
  var pkgname = '@cnpm/test-scope-package';
  var pkgURL = '/@' + encodeURIComponent(pkgname.substring(1));
  before(function (done) {
    // add scope package
    var pkg = utils.getPackage(pkgname, '0.0.1', utils.admin);

    request(app.listen())
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

  it('should get scope package info: /@scope%2Fname', function (done) {
    request(app.listen())
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
    request(app.listen())
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
    request(app.listen())
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
    request(app.listen())
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
});
