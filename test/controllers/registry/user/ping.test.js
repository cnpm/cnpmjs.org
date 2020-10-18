'use strict';

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var app = require('../../../../servers/registry');
var config = require('../../../../config');
var tokenService = require('../../../../services/token');
var TestUtil = require('../../../utils');

describe('test/controllers/registry/user/ping.test.js', function () {
  afterEach(mm.restore);

  describe('/-/ping', function () {
    var token;

    beforeEach(function* () {
      mm(config, 'syncModel', 'all');
      token = yield tokenService.createToken(TestUtil.admin);
    });

    afterEach(function* () {
      yield tokenService.deleteToken(TestUtil.admin, token.token);
    });

    describe('with write', function () {
      describe('has login', function () {
        it('should work', function (done) {
          request(app)
            .get('/-/ping?write=true')
            .set('authorization', 'Bearer ' + token.token)
            .expect(200, function (err, res) {
              should.not.exist(err);
              done();
            });
        });
      });

      describe('has not login', function () {
        it('should work', function (done) {
          request(app)
            .get('/-/ping?write=true')
            .set('authorization', 'Bearer ' + token.token)
            .expect(401, function (err, res) {
              done();
            });
        });
      });
    });

    describe('with not write', function () {
      describe('has login', function () {
        it('should work', function (done) {
          request(app)
            .get('/-/ping')
            .set('authorization', 'Bearer ' + token.token)
            .expect(200, function (err, res) {
              should.not.exist(err);
              done();
            });
        });
      });

      describe('has not login', function () {
        it('should work', function (done) {
          request(app)
            .get('/-/ping')
            .set('authorization', 'Bearer ' + token.token)
            .expect(200, function (err, res) {
              should.not.exist(err);
              done();
            });
        });
      });
    });
  });
});
