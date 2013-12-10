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
    app.listen(0, done);
  });
  after(function (done) {
    app.close(done);
  });

  describe('GET /~:name', function (done) {
    it('should get 200', function (done) {
      request(app)
      .get('/~dead_horse')
      .expect(200)
      .expect(/<div id="profile">/)
      .expect(/Packages by dead_horse/, done);
    });

    it('should get 404', function (done) {
      request(app)
      .get('/~not_exist_user')
      .expect(404, done);
    });

    it('should get not eixst user but have modules 200', function (done) {
      request(app)
      .get('/~jdalton')
      .expect(200)
      .expect(/<div id="profile">/)
      .expect(/Packages by jdalton/, done);
    });
  });
});
