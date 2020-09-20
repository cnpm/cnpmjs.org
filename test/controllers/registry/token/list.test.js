'use strict';

var should = require('should');
var app = require('../../../../servers/registry');
var request = require('supertest');
var tokenService = require('../../../../services/token');
var TestUtil = require('../../../utils');

describe('test/controllers/registry/token/list.test.js', function () {
  describe('GET /-/npm/v1/tokens', function () {
    var token;

    beforeEach(function* () {
      token = yield tokenService.createToken(TestUtil.admin);
    });

    afterEach(function* () {
      yield tokenService.deleteToken(TestUtil.admin, token.token);
    });

    it('should work', function (done) {
      request(app)
        .get(`/-/npm/v1/tokens`)
        .set('authorization', 'Bearer ' + token.token)
        .expect(200, function (err, res) {
          should.not.exist(err);
          should.exist(res.body.objects);
          done();
        });
    });

    describe('client error', function () {
      it('should check perPage is number', function (done) {
        request(app)
          .get(`/-/npm/v1/tokens?perPage=xxx`)
          .set('authorization', 'Bearer ' + token.token)
          .expect(400, done);
      });

      it('should check perPage in boundary', function (done) {
        request(app)
          .get(`/-/npm/v1/tokens?perPage=999999999`)
          .set('authorization', 'Bearer ' + token.token)
          .expect(400, done);
      });

      it('should check page is number', function (done) {
        request(app)
          .get(`/-/npm/v1/tokens?page=xxx`)
          .set('authorization', 'Bearer ' + token.token)
          .expect(400, done);
      });

      it('should check page gt 0', function (done) {
        request(app)
          .get(`/-/npm/v1/tokens?page=-4`)
          .set('authorization', 'Bearer ' + token.token)
          .expect(400, done);
      });
    });
  });
});
