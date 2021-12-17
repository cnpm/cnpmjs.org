'use strict';

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var app = require('../../../../servers/registry');
var config = require('../../../../config');
var tokenService = require('../../../../services/token');
var TestUtil = require('../../../utils');

describe('test/controllers/registry/user/whoami.test.js', function () {
  afterEach(mm.restore);

  describe('/-/whoami', function () {
    var token;

    beforeEach(function* () {
      mm(config, 'syncModel', 'all');
      token = yield tokenService.createToken(TestUtil.admin);
    });

    afterEach(function* () {
      yield tokenService.deleteToken(TestUtil.admin, token.token);
    });

    it('should work', function (done) {
      request(app)
        .get('/-/whoami')
        .set('authorization', 'Bearer ' + token.token)
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.username.should.eql(TestUtil.admin);
          done();
        });
    });
  });
});
