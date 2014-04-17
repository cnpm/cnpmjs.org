/**!
 * cnpmjs.org - test/middleware/static.test.js
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

var should = require('should');
var request = require('supertest');
var registry = require('../../servers/registry');
var web = require('../../servers/registry');

describe('middleware/static.test.js', function () {
  before(function (done) {
    registry = registry.listen(0, function () {
      web = web.listen(0, done);
    });
  });

  describe('registry', function () {
    it('should /favicon.ico rewrite to /favicon.png', function (done) {
      request(registry)
      .get('/favicon.ico')
      // .expect('content-type', 'image/png')
      .expect(200, done);
    });

    it('should 200 /favicon.png', function (done) {
      request(registry)
      .get('/favicon.png')
      .expect('content-type', 'image/png')
      .expect(200, done);
    });
  });

  describe('web', function () {
    it('should /favicon.ico rewrite to /favicon.png', function (done) {
      request(registry)
      .get('/favicon.ico')
      // .expect('content-type', 'image/png')
      .expect(200, done);
    });

    it('should 200 /favicon.png', function (done) {
      request(registry)
      .get('/favicon.png')
      .expect('content-type', 'image/png')
      .expect(200, done);
    });
  });
});
