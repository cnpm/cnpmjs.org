'use strict';

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

      it('should download from foo-us1 bucket', function(done) {
        mm(config.nfs, 'url', function(key, options) {
          return 'http://' + options.bucket + '.oss.com' + key;
        });
        mm(config, 'downloadRedirectToNFS', true);

        request(app)
        .get('/@cnpmtest/download-test-module/-/@cnpmtest/download-test-module-1.0.0.tgz?bucket=foo-us1')
        .expect('Location', 'http://foo-us1.oss.com/@cnpmtest/download-test-module/-/@cnpmtest/download-test-module-1.0.0.tgz')
        .expect(302, done);
      });

      it('should download from multi urls', function(done) {
        mm(config.nfs, 'urls', function(key, options) {
          return [
            'http://' + options.bucket + '.oss.com' + key,
            'http://default.oss.com' + key,
            'http://backup.oss.com' + key,
          ];
        });
        mm(config, 'downloadRedirectToNFS', true);

        request(app)
        .get('/@cnpmtest/download-test-module/-/@cnpmtest/download-test-module-1.0.0.tgz?bucket=foo-us1')
        .expect('Location', 'http://foo-us1.oss.com/@cnpmtest/download-test-module/-/@cnpmtest/download-test-module-1.0.0.tgz?other_urls=http%3A%2F%2Fdefault.oss.com%2F%40cnpmtest%2Fdownload-test-module%2F-%2F%40cnpmtest%2Fdownload-test-module-1.0.0.tgz%2Chttp%3A%2F%2Fbackup.oss.com%2F%40cnpmtest%2Fdownload-test-module%2F-%2F%40cnpmtest%2Fdownload-test-module-1.0.0.tgz')
        .expect(302, done);
      });

      it('should download from multi urls dont modifiy raw query', function(done) {
        mm(config.nfs, 'urls', function(key, options) {
          return [
            'http://' + options.bucket + '.oss.com' + key + '?foo=bar',
            'http://default.oss.com' + key,
            'http://backup.oss.com' + key,
          ];
        });
        mm(config, 'downloadRedirectToNFS', true);

        request(app)
        .get('/@cnpmtest/download-test-module/-/@cnpmtest/download-test-module-1.0.0.tgz?bucket=foo-us1')
        .expect('Location', 'http://foo-us1.oss.com/@cnpmtest/download-test-module/-/@cnpmtest/download-test-module-1.0.0.tgz?foo=bar&other_urls=http%3A%2F%2Fdefault.oss.com%2F%40cnpmtest%2Fdownload-test-module%2F-%2F%40cnpmtest%2Fdownload-test-module-1.0.0.tgz%2Chttp%3A%2F%2Fbackup.oss.com%2F%40cnpmtest%2Fdownload-test-module%2F-%2F%40cnpmtest%2Fdownload-test-module-1.0.0.tgz')
        .expect(302, done);
      });
    });
  });
});
