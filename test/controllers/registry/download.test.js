/**!
 * cnpmjs.org - test/controllers/registry/download.test.js
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

var request = require('supertest');
var app = require('../../../servers/registry');
var utils = require('../../utils');

describe('controllers/registry/download.test.js', function () {
  before(function (done) {
    var pkg = utils.getPackage('download-test-module', '1.0.0', utils.admin);
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  describe('GET /:name/download/:filename', function () {
    it('should download a file with 200', function (done) {
      request(app.listen())
      .get('/download-test-module/download/download-test-module-1.0.0.tgz')
      .expect(200, done);
    });

    it('should alias /:name/-/:filename to /:name/download/:filename', function (done) {
      request(app.listen())
      .get('/download-test-module/-/download-test-module-1.0.0.tgz')
      .expect(200, done);
    });
  });
});
