/**!
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var mm = require('mm');
var config = require('../../../../config');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('test/controllers/registry/package/download.test.js', function () {
  before(function (done) {
    var pkg = utils.getPackage('@cnpmtest/download-test-module', '1.0.0', utils.admin);
    request(app)
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  afterEach(mm.restore);

  describe('GET /:name/download/:filename', function () {
    it('should download a file with 200', function (done) {
      request(app)
      .get('/@cnpmtest/download-test-module/download/@cnpmtest/download-test-module-1.0.0.tgz')
      .expect(200, done);
    });

    it('should alias /:name/-/:filename to /:name/download/:filename', function (done) {
      request(app)
      .get('/@cnpmtest/download-test-module/-/@cnpmtest/download-test-module-1.0.0.tgz')
      .expect(200, done);
    });

    it('should 404 when package not exists', function (done) {
      request(app)
      .get('/@cnpmtest/download-test-module-not-exists/download/@cnpmtest/download-test-module-not-exists-1.0.0.tgz')
      .expect(404, done);
    });

    describe('nfs.url is function', function() {
      it('should work with nfs.url is generatorFunction', function(done) {
        mm(config.nfs, 'url', function*(key) {
          return 'http://foo.test.com' + key;
        });
        mm(config, 'downloadRedirectToNFS', true);

        request(app)
        .get('/@cnpmtest/download-test-module/-/@cnpmtest/download-test-module-1.0.0.tgz')
        .expect('Location', 'http://foo.test.com/@cnpmtest/download-test-module/-/@cnpmtest/download-test-module-1.0.0.tgz')
        .expect(302, done);
      });

      it('should work with nfs.url is function', function(done) {
        mm(config.nfs, 'url', function(key) {
          return 'http://foo.test.com' + key;
        });
        mm(config, 'downloadRedirectToNFS', true);

        request(app)
        .get('/@cnpmtest/download-test-module/-/@cnpmtest/download-test-module-1.0.0.tgz')
        .expect('Location', 'http://foo.test.com/@cnpmtest/download-test-module/-/@cnpmtest/download-test-module-1.0.0.tgz')
        .expect(302, done);
      });
    });
  });
});
