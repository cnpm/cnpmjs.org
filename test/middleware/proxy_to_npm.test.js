'use strict';

var request = require('supertest');
var mm = require('mm');
var utils = require('../utils');
var web = require('../../servers/web');
var registry = require('../../servers/registry');
var config = require('../../config');

describe('test/middleware/proxy_to_npm.test.js', () => {
  beforeEach(() => {
    mm(config, 'syncModel', 'none');
  });

  afterEach(mm.restore);

  describe('package', () => {
    it('should proxy to source registry when package not exists', done => {
      request(registry)
        .get('/ms')
        .expect('location', config.sourceNpmRegistry + '/ms')
        .expect(302, done);
    });

    it('should proxy to source registry when package is not local', done => {
      request(registry)
        .get('/baidu?write=true')
        .expect('location', config.sourceNpmRegistry + '/baidu?write=true')
        .expect(302, done);
    });

    it('should not proxy to source registry when package is private scoped', function* () {
      var pkg = utils.getPackage('@cnpmtest/proxy_to_npm_private_pkg');
      yield request(registry)
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201);

      yield request(registry)
        .get('/@cnpmtest/proxy_to_npm_private_pkg')
        .expect(200);
    });

    it('should proxy to source registry when package is public scoped', done => {
      request(registry)
        .get('/@jkroso/type')
        .expect('Location', config.sourceNpmRegistry + '/@jkroso/type')
        .expect(302, done);
    });
  });

  describe('dist-tags', () => {
    it('should proxy to source registry when package not exists', done => {
      request(registry)
        .get('/-/package/ms/dist-tags')
        .expect('location', config.sourceNpmRegistry + '/-/package/ms/dist-tags')
        .expect(302, done);
      });

    it('should proxy public scoped package', done => {
      request(registry)
        .get('/-/package/@koajs/ms/dist-tags')
        .expect('Location', config.sourceNpmRegistry + '/-/package/@koajs/ms/dist-tags')
        .expect(302, done);
    });

    it('should dont proxy private scoped package', function* () {
      var pkg = utils.getPackage('@cnpmtest/proxy_to_npm_pkg');
      yield request(registry)
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201);

      yield request(registry)
        .get('/-/package/@cnpmtest/proxy_to_npm_pkg/dist-tags')
        .expect(200);
    });
  });
});
