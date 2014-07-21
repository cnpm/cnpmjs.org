/*!
 * cnpmjs.org - test/controllers/web/user.test.js
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

var should = require('should');
var request = require('supertest');
var app = require('../../../servers/web');

describe('controllers/web/user.test.js', function () {
  before(function (done) {
    app = app.listen(0, done);
  });

  describe('GET /~:name', function (done) {
    it('should get 200', function (done) {
      request(app)
      .get('/~cnpmjstest10')
      .expect(200)
      .expect('content-type', 'text/html; charset=utf-8')
      .expect(/<div id="profile">/)
      .expect(/Packages by /, done);
    });

    it('should get 404', function (done) {
      request(app)
      .get('/~not_exist_user')
      .expect(404, done);
    });

    it('should get not eixst user but have modules 200', function (done) {
      request(app)
      .get('/~cnpmjstest101')
      .expect(200)
      .expect(/<div id="profile">/)
      .expect(/Packages by/, done);
    });
  });
});
