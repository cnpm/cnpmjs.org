/**!
 * cnpmjs.org - test/middleware/web_not_found.test.js
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
var utils = require('../utils');
var app = require('../../servers/web');
var registry = require('../../servers/registry');

describe('middleware/web_not_found.test.js', function () {
  before(function (done) {
    var pkg = utils.getPackage('@cnpmtest/mk2testmodule');
    request(registry)
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .end(done);
  });

  describe('web_not_found()', function () {
    it('should redirect /mk2testmodule to /package/mk2testmodule', function (done) {
      request(app)
      .get('/@cnpmtest/mk2testmodule')
      .expect('Location', '/package/@cnpmtest/mk2testmodule')
      .expect(302, done);
    });

    it('should 404 /~byte', function (done) {
      request(app)
      .get('/~byte')
      .expect(404, done);
    });

    it('should 200 /package/mk2testmodule', function (done) {
      request(app)
      .get('/package/@cnpmtest/mk2testmodule')
      .expect(200, done);
    });

    it('should 404 /package/byte404', function (done) {
      request(app)
      .get('/package/@cnpmtest/byte404')
      .expect(404, done);
    });
  });
});
