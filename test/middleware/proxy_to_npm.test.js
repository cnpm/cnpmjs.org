'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var mm = require('mm');
var app = require('../../servers/registry');
var config = require('../../config');

describe('test/middleware/proxy_to_npm.test.js', () => {
  beforeEach(() => {
    mm(config, 'syncModel', 'none');
  });

  afterEach(mm.restore);

  describe('package', () => {
    it('should proxy to source registry when package not exists', done => {
      request(app.listen())
      .get('/ms')
      .expect('location', config.sourceNpmRegistry + '/ms')
      .expect(302, done);
    });

    it('should proxy to source registry when package is not local', done => {
      request(app.listen())
      .get('/baidu?write=true')
      .expect('location', config.sourceNpmRegistry + '/baidu?write=true')
      .expect(302, done);
    });

    it('should not proxy to source registry when package is private scoped', done => {
      request(app.listen())
      .get('/@cnpmtest/test-package-name')
      .expect(404, done);
    });

    it('should proxy to source registry when package is public scoped', done => {
      request(app.listen())
      .get('/@jkroso/type')
      .expect('Location', 'https://registry.npmjs.com/@jkroso/type')
      .expect(302, done);
    });
  });

  describe('dist-tags', () => {
    it('should proxy to source registry when package not exists', done => {
      request(app.listen())
      .get('/-/package/ms/dist-tags')
      .expect('location', config.sourceNpmRegistry + '/-/package/ms/dist-tags')
      .expect(302, done);
    });

    it('should dont proxy scoped package', done => {
      request(app.listen())
      .get('/-/package/@scoped/ms/dist-tags')
      .expect(404, done);
    });
  });
});
