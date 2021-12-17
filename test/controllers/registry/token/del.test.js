'use strict';

var should = require('should');
var app = require('../../../../servers/registry');
var request = require('supertest');
var tokenService = require('../../../../services/token');
var TestUtil = require('../../../utils');

describe('test/controllers/registry/token/del.test.js', function () {
  describe('DELETE /-/npm/v1/tokens', function () {
    var token;

    beforeEach(function* () {
      token = yield tokenService.createToken(TestUtil.admin);
    });

    it('should work', function (done) {
      request(app)
        .delete(`/-/npm/v1/tokens/token/${token.token}`)
        .set('authorization', 'Bearer ' + token.token)
        .expect(204, done);
    });
  });
});
