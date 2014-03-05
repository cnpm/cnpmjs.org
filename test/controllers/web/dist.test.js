/**!
 * cnpmjs.org - test/controllers/web/dist.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.cnpmjs.org)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var request = require('supertest');
var app = require('../../../servers/web');

describe('controllers/web/dist.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });
  after(function (done) {
    app.close(done);
  });

  describe('GET /dist', function (done) {
    it('should 302 to config.disturl', function (done) {
      request(app)
      .get('/dist')
      .expect('Location', 'http://dist.u.qiniudn.com/')
      .expect(302, done);
    });
  });
});
