'use strict';

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var app = require('../../../servers/web');
var registry = require('../../../servers/registry');
var utils = require('../../utils');
var config = require('../../../config')

describe('test/controllers/web/badge.test.js', function () {
  afterEach(mm.restore);

  describe('GET /badge/v/:name.svg', function () {
    it('should show blue version on >=1.0.0 when package exists', function (done) {
      var pkg = utils.getPackage('@cnpmtest/badge-test-module', '1.0.1', utils.admin);
      request(registry)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .end(function (err) {
        should.not.exists(err);
        request(app)
        .get('/badge/v/@cnpmtest/badge-test-module.svg?style=flat-square')
        .expect('Location', 'https://badgen.net/badge/cnpm/1.0.1/blue')
        .expect(302, done);
      });
    });

    it('should show version', function (done) {
      var pkg = utils.getPackage('@cnpmtest/badge-test-module', '1.0.0', utils.admin);
      request(registry)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .end(function (err) {
        should.not.exists(err);
        request(app)
        .get('/badge/v/@cnpmtest/badge-test-module.svg?style=flat-square&version=1.0.0')
        .expect('Location', 'https://badgen.net/badge/cnpm/1.0.0/blue')
        .expect(302, done);
      });
    });

    it('should show tag', function (done) {
      var pkg = utils.getPackage('@cnpmtest/badge-test-module', '2.0.1', utils.admin, 'v2');
      request(registry)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .end(function (err) {
        should.not.exists(err);
        request(app)
        .get('/badge/v/@cnpmtest/badge-test-module.svg?style=flat-square&tag=v2')
        .expect('Location', 'https://badgen.net/badge/cnpm/2.0.1/blue')
        .expect(302, done);
      });
    });

    it('should support custom subject', function (done) {
      var pkg = utils.getPackage('@cnpmtest/badge-test-module', '3.0.1', utils.admin, 'v3');
      request(registry)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .end(function (err) {
        should.not.exists(err);
        request(app)
        .get('/badge/v/@cnpmtest/badge-test-module.svg?style=flat-square&tag=v3&subject=ant-design')
        .expect('Location', 'https://badgen.net/badge/ant-design/3.0.1/blue')
        .expect(302, done);
      });
    });

    it('should support 1.0.0-beta1', function (done) {
      var pkg = utils.getPackage('@cnpmtest/badge-test-module', '1.0.0-beta1', utils.admin);
      request(registry)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .end(function (err) {
        should.not.exists(err);
        request(app)
        .get('/badge/v/@cnpmtest/badge-test-module.svg?style=flat-square')
        .expect('Location', 'https://badgen.net/badge/cnpm/1.0.0-beta1/blue')
        .expect(302, done);
      });
    });

    it('should show green version on <1.0.0 & >=0.1.0 when package exists', function (done) {
      var pkg = utils.getPackage('@cnpmtest/badge-test-module', '0.1.0', utils.admin);
      request(registry)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .end(function (err) {
        should.not.exists(err);
        request(app)
        .get('/badge/v/@cnpmtest/badge-test-module.svg')
        .expect('Location', 'https://badgen.net/badge/cnpm/0.1.0/green')
        .expect(302, done);
      });
    });

    it('should show green version on <0.1.0 & >=0.0.0 when package exists', function (done) {
      var pkg = utils.getPackage('@cnpmtest/badge-test-module', '0.0.0', utils.admin);
      request(registry)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .end(function (err) {
        should.not.exists(err);
        request(app)
        .get('/badge/v/@cnpmtest/badge-test-module.svg?style=flat-square')
        .expect('Location', 'https://badgen.net/badge/cnpm/0.0.0/red')
        .expect(302, done);
      });
    });

    it('should show invalid when package not exists', function (done) {
      request(app)
      .get('/badge/v/@cnpmtest/badge-test-module-not-exists.svg?style=flat')
      .expect('Location', 'https://badgen.net/badge/cnpm/invalid/grey')
      .expect(302, done);
    });
  });

  describe('GET /badge/d/:name.svg', function () {
    it('should show downloads count', function (done) {
      var pkg = utils.getPackage('@cnpmtest/badge-download-module', '1.0.1', utils.admin);
      request(registry)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .end(function (err) {
        should.not.exists(err);
        request(app)
        .get('/badge/d/@cnpmtest/badge-download-module.svg')
        .expect('Location', 'https://badgen.net/badge/downloads/0')
        .expect(302, done);
      });
    });
  });
});
