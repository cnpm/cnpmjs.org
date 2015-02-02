/**!
 * cnpmjs.org - test/middleware/proxy_to_npm.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var mm = require('mm');
var app = require('../../servers/registry');
var config = require('../../config');

describe('middleware/proxy_to_npm.test.js', function () {
  beforeEach(function () {
    mm(config, 'syncModel', 'none');
  });

  afterEach(mm.restore);

  describe('package', function () {
    it('should proxy to source registry when package not exists', function (done) {
      request(app.listen())
      .get('/ms')
      .expect('location', config.sourceNpmRegistry + '/ms')
      .expect(302, done);
    });

    it('should proxy to source registry when package is not local', function (done) {
      request(app.listen())
      .get('/baidu?write=true')
      .expect('location', config.sourceNpmRegistry + '/baidu?write=true')
      .expect(302, done);
    });

    it('should not proxy to source registry when package is scoped', function (done) {
      request(app.listen())
      .get('/@scoped/test-package-name')
      .expect(404, done);
    });
  });

  describe('dist-tags', function () {
    it('should proxy to source registry when package not exists', function (done) {
      request(app.listen())
      .get('/-/package/ms/dist-tags')
      .expect('location', config.sourceNpmRegistry + '/-/package/ms/dist-tags')
      .expect(302, done);
    });

    it('should dont proxy scoped package', function (done) {
      request(app.listen())
      .get('/-/package/@scoped/ms/dist-tags')
      .expect(404, done);
    });
  });
});
