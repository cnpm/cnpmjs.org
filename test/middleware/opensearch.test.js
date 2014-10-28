/**!
 * cnpmjs.org - test/middleware/opensearch.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var app = require('../../servers/web');

describe('middleware/opensearch.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });
  after(function (done) {
    app.close(done);
  });

  describe('GET /opensearch.xml', function () {
    it('should get 200', function (done) {
      request(app)
      .get('/opensearch.xml')
      .set('host', 'localhost')
      .expect(/http:\/\/localhost/, done);
    });
  });
});
