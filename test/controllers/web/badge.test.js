/*!
 * cnpmjs.org - test/controllers/web/badge.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var app = require('../../../servers/web');
var registry = require('../../../servers/registry');
var utils = require('../../utils');
var config = require('../../../config')

describe('controllers/web/badge.test.js', function () {
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
        .expect('Location', config.badgePrefixURL + '/cnpm-1.0.1-blue.svg?style=flat-square')
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
        .expect('Location', config.badgePrefixURL + '/cnpm-2.0.1-blue.svg?style=flat-square')
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
        .expect('Location', config.badgePrefixURL + '/ant--design-3.0.1-blue.svg?style=flat-square')
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
        .expect('Location', config.badgePrefixURL + '/cnpm-1.0.0--beta1-blue.svg?style=flat-square')
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
        .get('/badge/v/@cnpmtest/badge-test-module.svg?style=flat-square')
        .expect('Location', config.badgePrefixURL + '/cnpm-0.1.0-green.svg?style=flat-square')
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
        .expect('Location', config.badgePrefixURL + '/cnpm-0.0.0-red.svg?style=flat-square')
        .expect(302, done);
      });
    });

    it('should show invalid when package not exists', function (done) {
      request(app)
      .get('/badge/v/@cnpmtest/badge-test-module-not-exists.svg?style=flat')
      .expect('Location', config.badgePrefixURL + '/cnpm-invalid-lightgrey.svg?style=flat')
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
        .get('/badge/d/@cnpmtest/badge-download-module.svg?style=flat-square')
        .expect('Location', config.badgePrefixURL + '/downloads-0-brightgreen.svg?style=flat-square')
        .expect(302, done);
      });
    });
  });
});
