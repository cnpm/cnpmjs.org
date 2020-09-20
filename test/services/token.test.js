'use strict';

var should = require('should');
var TokenService = require('../../services/token');
var TestUtils = require('../utils');

describe('service/token.test.js', function() {
  var token;
  afterEach(function* () {
    if (!token) return
    yield TokenService.deleteToken(TestUtils.admin, token.token);
  });

  describe('createToken()', function() {
    describe('default options', function() {
      it('should create token success', function* () {
        token = yield TokenService.createToken(TestUtils.admin);
        should.exist(token);
        should.exist(token.token);
        should.exist(token.key);
        token.cidr_whitelist.should.eql([]);
        token.readonly.should.eql(false);
      });
    });

    describe('custom options', function() {
      it('should create token success', function* () {
        token = yield TokenService.createToken(TestUtils.admin, {
          cidrWhitelist: [ '127.0.0.1' ],
          readonly: true,
        });
        should.exist(token);
        should.exist(token.token);
        should.exist(token.key);
        token.cidr_whitelist.should.eql([ '127.0.0.1' ]);
        token.readonly.should.eql(true);
      });
    });
  });

  describe('validateToken()', function() {
    describe('normal', function() {
      beforeEach(function* () {
        token = yield TokenService.createToken(TestUtils.admin);
      });

      describe('token is exits', function() {
        it('should get user', function* () {
          var user = yield TokenService.validateToken(token.token, {
            isReadOperation: true,
            accessIp: '127.0.0.1',
          });
          should.exist(user);
        });
      });

      describe('token is not exits', function() {
        it('should not get user', function* () {
          var user = yield TokenService.validateToken('not exits', {
            isReadOperation: true,
            accessIp: '127.0.0.1',
          });
          should.not.exist(user);
        });
      });
    });

    describe('readonly case', function() {
      beforeEach(function* () {
        token = yield TokenService.createToken(TestUtils.admin, {
          readonly: true,
        });
      });

      describe('read operation', function() {
        it('should get user', function* () {
          var user = yield TokenService.validateToken(token.token, {
            isReadOperation: true,
            accessIp: '127.0.0.1',
          });
          should.exist(user);
        });
      });

      describe('write operation', function() {
        it('should not get user', function* () {
          var user = yield TokenService.validateToken('not exits', {
            isReadOperation: false,
            accessIp: '127.0.0.1',
          });
          should.not.exist(user);
        });
      });
    });

    describe('cidr case', function() {
      beforeEach(function* () {
        token = yield TokenService.createToken(TestUtils.admin, {
          cidrWhitelist: [ '127.0.0.1' ],
        });
      });

      describe('in white list', function() {
        it('should get user', function* () {
          var user = yield TokenService.validateToken(token.token, {
            isReadOperation: true,
            accessIp: '127.0.0.1',
          });
          should.exist(user);
        });
      });

      describe('not in white list', function() {
        it('should not get user', function* () {
          var user = yield TokenService.validateToken('not exits', {
            isReadOperation: true,
            accessIp: '127.0.0.2',
          });
          should.not.exist(user);
        });
      });
    });
  });

  describe('listToken()', function() {
    var token1;
    var token2;

    beforeEach(function* () {
      token1 = yield TokenService.createToken(TestUtils.admin);
      token2 = yield TokenService.createToken(TestUtils.admin);
    });

    afterEach(function* () {
      yield TokenService.deleteToken(token1.user, token1.token);
      yield TokenService.deleteToken(token2.user, token2.token);
    });

    it('perPage/page should work', function* () {
      var tokens = yield TokenService.listToken(TestUtils.admin, {
        perPage: 1,
        page: 0,
      });
      should.exist(tokens);
      tokens[0].key.should.eql(token1.key);

      tokens = yield TokenService.listToken(TestUtils.admin, {
        perPage: 1,
        page: 1,
      });
      should.exist(tokens);
      tokens[0].key.should.eql(token2.key);
    });
  });

  describe('deleteToken()', function() {
    beforeEach(function* () {
      token = yield TokenService.createToken(TestUtils.admin);
    });

    describe('delete by key prefix', function() {
      it('should work', function* () {
        yield TokenService.deleteToken(TestUtils.admin, token.key.substring(0, 6));
        var user = yield TokenService.validateToken(token.token, { isReadOperation: false, accessIp: '127.0.0.1' });
        should.not.exists(user);
      });
    });

    describe('delete by token', function() {
      it('should work', function* () {
        yield TokenService.deleteToken(TestUtils.admin, token.token);
        var user = yield TokenService.validateToken(token.token, { isReadOperation: false, accessIp: '127.0.0.1' });
        should.not.exists(user);
      });
    });
  });
});
