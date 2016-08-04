/**!
 * cnpmjs.org - test/middleware/auth.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var app = require('../../servers/registry');
var mm = require('mm');
var config = require('../../config');
var userService = require('../../services/user');

describe('middleware/auth.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });
  after(function (done) {
    app.close(done);
  });

  afterEach(mm.restore);

  describe('auth()', function () {
    it('should pass if no authorization', function (done) {
      request(app)
      .get('/-/user/org.couchdb.user:cnpmjstest10')
      .expect(200, done);
    });

    it('should pass with authorization and check ok', function (done) {
      request(app)
      .get('/-/user/org.couchdb.user:cnpmjstest10')
      .set('authorization', 'basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64'))
      .expect(200, done);
    });

    it('should pass with authorization and check fail', function (done) {
      // npm install no need to check auth
      request(app)
      .get('/-/user/org.couchdb.user:cnpmjstest10')
      .set('authorization', 'basic ' + new Buffer('cnpmjstest10:cnpmjstest').toString('base64'))
      .expect(200, done);
    });

    it('should pass with authorization (password contains ":") and check ok', function (done) {
      request(app)
      .get('/-/user/org.couchdb.user:cnpmjstest104')
      .set('authorization', 'basic ' + new Buffer('cnpmjstest104:cnpmjs:test104').toString('base64'))
      .expect(200, done);
    });

    describe('config.customUserService = true', function () {
      beforeEach(function () {
        mm(config, 'customUserService', true);
      });

      it('should 401 when user service auth throw error', function (done) {
        mm(userService, 'auth', function* () {
          var err = new Error('mock user service auth error, please visit http://ooxx.net/user to sigup first');
          err.name = 'UserSeriveAuthError';
          err.status = 401;
          throw err;
        });

        request(app)
        .put('/-/user/org.couchdb.user:cnpmjstest10/-rev/1')
        .set('authorization', 'basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64'))
        .expect({
          error: 'UserSeriveAuthError',
          reason: 'mock user service auth error, please visit http://ooxx.net/user to sigup first'
        })
        .expect(401, done);
      });
    });
  });

  describe('config.alwaysAuth = true', function () {
    beforeEach(function () {
      mm(config, 'alwaysAuth', true);
    });

    it('should required auth for GET registry request', function (done) {
      request(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect({
        error: 'unauthorized',
        reason: 'login first'
      })
      .expect(401, done);
    });

    it('should required auth for GET web request', function (done) {
      request(app)
      .get('/')
      .set('Accept', 'text/html')
      .expect('login first')
      .expect(401, done);
    });
  });
});
