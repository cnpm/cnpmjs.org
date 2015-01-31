/**!
 * cnpmjs.org - test/middleware/cors.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var app = require('../../servers/registry');

describe('middleware/cors.test.js', function () {
  it('should enable cors when request contains Origin header', function (done) {
    request(app.listen())
    .get('/')
    .set('Origin', 'http://www.google.com')
    .expect('Access-Control-Allow-Methods', 'GET,HEAD')
    .expect('Access-Control-Allow-Origin', 'http://www.google.com')
    .expect(200, done);
  });

  it('should * when Origin not set', function (done) {
    request(app.listen())
    .get('/')
    .expect('Access-Control-Allow-Origin', '*')
    .expect(200, done);
  });
});
