'use strict';

var should = require('should');
var uuid = require('uuid');
var Token = require('../../models').Token;
var TestUtil = require('../utils');

describe('models/token.test.js', function () {
  describe('deleteByKeyOrToken', function () {
    var token1;
    var token2;

    beforeEach(function *() {
      var token1Str = 'mock_token1_' + uuid.v4();
      var token2Str= 'mock_token2_' + uuid.v4();

      token1 = yield Token.add({
        token: token1Str,
        userId: TestUtil.admin,
        readonly: false,
        key: '1_token_1' + token1Str,
        cidrWhitelist: [],
      });

      token2 = yield Token.add({
        token: token2Str,
        userId: TestUtil.admin,
        readonly: false,
        key: '1_token_2' + token2Str,
        cidrWhitelist: [],
      });
    });

    describe('delete by key', function () {
      it('should work', function* () {
        yield Token.deleteByKeyOrToken(TestUtil.admin, '1_token_1');
        var tokenRow = yield Token.findByToken(token1.token);
        should.not.exist(tokenRow);
      });

      describe('key is ambiguous', function () {
        it('should not delete token', function* () {
          var error;
          try {
            yield Token.deleteByKeyOrToken(TestUtil.admin, '1_token_');
          } catch (e) {
            error = e;
          }
          should.exist(error);
          error.message.should.match(/Token ID ".+" was ambiguous/);
        });
      });
    });
  });
});
