/**!
 * cnpmjs.org - test/middleware/auth.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var request = require('supertest');
var app = require('../../servers/registry');
var mm = require('mm');
var mysql = require('../../common/mysql');
var config = require('../../config');
var UserService = require('../../services/user');

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

    it('should 500 with authorization and mysql error', function (done) {
      mm.error(mysql, 'query', 'mock error');
      request(app)
      .get('/-/user/org.couchdb.user:cnpmjstest10')
      .set('authorization', 'basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64'))
      .expect(500, done);
    });

    describe('config.customUserService = true', function () {
      beforeEach(function () {
        mm(config, 'customUserService', true);
      });

      it('should 401 when user service auth throw error', function (done) {
        mm(UserService, 'auth', function* () {
          var err = new Error('mock user service auth error, please visit http://ooxx.net/user to sigup first');
          err.name = 'UserSeriveAuthError';
          err.status = 401;
          throw err;
        });

        request(app)
        .get('/-/user/org.couchdb.user:cnpmjstest10')
        .set('authorization', 'basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64'))
        .expect({
          error: 'UserSeriveAuthError',
          reason: 'mock user service auth error, please visit http://ooxx.net/user to sigup first'
        })
        .expect(401, done);
      });
    });
  });
});
