'use strict';

var should = require('should');
var request = require('supertest');
var app = require('../../../../servers/registry');
var tokenService = require('../../../../services/token');
var TestUtil = require('../../../utils');

describe('test/controllers/registry/token/create.test.js', function () {
  describe('POST /-/npm/v1/tokens', function () {
    var token;

    beforeEach(function* () {
      token = yield tokenService.createToken(TestUtil.admin);
    });

    afterEach(function* () {
      yield tokenService.deleteToken(TestUtil.admin, token.token);
    });

    it('should work', function (done) {
      request(app)
        .post('/-/npm/v1/tokens')
        .set('authorization', 'Bearer ' + token.token)
        .send({
          password: TestUtil.admin,
          readonly: true,
          cidr_whitelist: [ '127.0.0.1' ],
        })
        .expect(201, function (err, res) {
          should.not.exist(err);
          res.body.should.have.keys('token', 'key', 'cidr_whitelist', 'readonly', 'created', 'updated');
          res.body.readonly.should.equal(true);
          res.body.cidr_whitelist.should.deepEqual([ '127.0.0.1' ]);
          done();
        });
    });

    describe('password is wrong', function () {
      it('should 401', function (done) {
        request(app)
          .post('/-/npm/v1/tokens')
          .set('authorization', 'Bearer ' + token.token)
          .send({
            password: 'wrong password',
            readonly: true,
            cidr_whitelist: [ '127.0.0.1' ],
          })
          .expect(401, done);
      });
    });

    describe('client error', function () {
      it('should check readonly', function (done) {
        request(app)
          .post('/-/npm/v1/tokens')
          .set('authorization', 'Bearer ' + token.token)
          .send({
            password: TestUtil.admin,
            readonly: 'true',
            cidr_whitelist: [ '127.0.0.1' ],
          })
          .expect(400, done);
      });

      it('should check cird', function (done) {
        request(app)
          .post('/-/npm/v1/tokens')
          .set('authorization', 'Bearer ' + token.token)
          .send({
            password: TestUtil.admin,
            readonly: true,
            cidr_whitelist: [ 'xxx.0.0.1' ],
          })
          .expect(400, done);
      });
    });
  });
});
