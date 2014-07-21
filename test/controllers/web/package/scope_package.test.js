/**!
 * cnpmjs.org - test/controllers/web/package/scope_package.test.js
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
var pedding = require('pedding');
var mm = require('mm');
var config = require('../../../../config');
var registry = require('../../../../servers/registry');
var web = require('../../../../servers/web');
var utils = require('../../../utils');

describe('controllers/web/package/scope_package.test.js', function () {
  var pkgname = '@cnpm/test-web-scope-package';
  var pkgURL = '/@' + encodeURIComponent(pkgname.substring(1));
  before(function (done) {
    done = pedding(2, done);
    registry = registry.listen(0, function () {
      // add scope package
      var pkg = utils.getPackage(pkgname, '0.0.1', utils.admin);
      request(registry)
      .put(pkgURL)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err) {
        should.not.exist(err);
        pkg = utils.getPackage(pkgname, '0.0.2', utils.admin);
        // publish 0.0.2
        request(registry)
        .put(pkgURL)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, done);
      });
    });
    web = web.listen(0, done);
  });

  afterEach(mm.restore);

  it('should show scope package info page: /@scope%2Fname', function (done) {
    request(web)
    .get('/package' + pkgURL)
    .expect(200, function (err, res) {
      should.not.exist(err);
      var body = res.text;
      body.should.containEql('$ cnpm install @cnpm/test-web-scope-package');
      body.should.containEql('/@cnpm/test-web-scope-package/download/@cnpm/test-web-scope-package-0.0.2.tgz');
      done();
    });
  });

  it('should show scope package info page: encodeURIComponent("/@scope/name")', function (done) {
    request(web)
    .get('/package/' + encodeURIComponent(pkgname))
    .expect(200, function (err, res) {
      should.not.exist(err);
      var body = res.text;
      body.should.containEql('$ cnpm install @cnpm/test-web-scope-package');
      body.should.containEql('/@cnpm/test-web-scope-package/download/@cnpm/test-web-scope-package-0.0.2.tgz');
      done();
    });
  });

  it('should show scope package info page: /@scope/name', function (done) {
    request(web)
    .get('/package/' + pkgname)
    .expect(200, function (err, res) {
      should.not.exist(err);
      var body = res.text;
      body.should.containEql('$ cnpm install @cnpm/test-web-scope-package');
      body.should.containEql('/@cnpm/test-web-scope-package/download/@cnpm/test-web-scope-package-0.0.2.tgz');
      done();
    });
  });

  it('should /package/@scope/name/ 404', function (done) {
    request(web)
    .get('/package/' + pkgname + '/')
    .expect(404, done);
  });

  it('should show scope package with version: /@scope/name/0.0.2', function (done) {
    request(web)
    .get('/package/' + pkgname + '/0.0.2')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var body = res.text;
      body.should.containEql('$ cnpm install @cnpm/test-web-scope-package');
      body.should.containEql('/@cnpm/test-web-scope-package/download/@cnpm/test-web-scope-package-0.0.2.tgz');
      done();
    });
  });

  it('should /@scope/name redirect to /package/@scope/name', function (done) {
    request(web)
    .get('/' + pkgname)
    .expect('Location', '/package/' + pkgname)
    .expect(302, done);
  });

  describe('support default scope', function () {
    before(function (done) {
      var pkg = utils.getPackage('test-default-web-scope-package', '0.0.1', utils.admin);
      request(registry)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });

    it('should adapt /@cnpm/test-default-web-scope-package => /test-default-web-scope-package', function (done) {
      mm(config, 'defaultScope', '@cnpm');
      request(web)
      .get('/package/@cnpm/test-default-web-scope-package')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var body = res.text;
        body.should.containEql('@cnpm/test-default-web-scope-package');
        body.should.containEql('/test-default-web-scope-package/download/test-default-web-scope-package-0.0.1.tgz');
        done();
      });
    });

    it('should not adapt', function (done) {
      mm(config, 'defaultScope', '');
      request(web)
      .get('/package/@cnpm/test-default-web-scope-package')
      .expect(404, done);
    });

    it('should 404 when scope not match', function (done) {
      mm(config, 'defaultScope', '@cnpm123');
      request(web)
      .get('/package/@cnpm/test-default-web-scope-package')
      .expect(404, done);
    });

    it('should 404 when pkg not exists', function (done) {
      mm(config, 'defaultScope', '@cnpm');
      request(web)
      .get('/package/@cnpm/test-default-web-scope-package-not-exists')
      .expect(404, done);
    });
  });
});
