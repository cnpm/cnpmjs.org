'use strict';

var request = require('supertest');
var mm = require('mm');
var app = require('../../../../servers/registry');
var userService = require('../../../../services/user');
var config = require('../../../../config');

describe('controllers/registry/user/update.test.js', function () {
  afterEach(mm.restore);

  beforeEach(function () {
    mm(config, 'customUserService', false);
  });

  describe('PUT /-/user/:name/-rev/:rev', function () {
    it('should 404 when without a name', function (done) {
      request(app)
      .put('/-/user/org.couchdb.user:/-rev/:1-123')
      .expect(404, done);
    });

    it('should put 401 when name not expect', function (done) {
      request(app)
      .put('/-/user/org.couchdb.user:name/-rev/:1-123')
      .set('authorization', 'basic ' + Buffer.from('cnpmjstest10:cnpmjstest10').toString('base64'))
      .expect(401, done);
    });

    it('should 500 when user.update error', function (done) {
      mm(userService, 'update', function* () {
        throw new Error('mock update error');
      });
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest101/-rev/:1-123')
      .send({
        name: 'cnpmjstest101',
        password: 'cnpmjstest101',
        email: 'cnpmjstest101@cnpmjs.org'
      })
      .set('authorization', 'basic ' + Buffer.from('cnpmjstest101:cnpmjstest101').toString('base64'))
      .expect(500, done);
    });

    it('should 201 when req.body.rev error', function (done) {
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest101/-rev/:1-123')
      .set('authorization', 'basic ' + Buffer.from('cnpmjstest101:cnpmjstest101').toString('base64'))
      .send({
        name: 'cnpmjstest101',
        password: 'cnpmjstest101',
        email: 'cnpmjstest101@cnpmjs.org',
        rev: '1-123'
      })
      .expect(201, done);
    });

    it('should 409 when userService.update return null', function (done) {
      mm(userService, 'update', function* () {
        return null;
      });
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest101/-rev/:1-123')
      .set('authorization', 'basic ' + Buffer.from('cnpmjstest101:cnpmjstest101').toString('base64'))
      .send({
        name: 'cnpmjstest101',
        password: 'cnpmjstest101',
        email: 'cnpmjstest101@cnpmjs.org',
        rev: '1-123'
      })
      .expect({
        error: '[conflict] Document update conflict',
        reason: '[conflict] Document update conflict',
      })
      .expect(409, done);
    });

    it('should 422 when req.body empty', function (done) {
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest10/-rev/:1-123')
      .set('authorization', 'basic ' + Buffer.from('cnpmjstest10:cnpmjstest10').toString('base64'))
      .send({})
      .expect({
        error: '[param_error] params missing, name, email or password missing',
        reason: '[param_error] params missing, name, email or password missing',
      })
      .expect(422, done);
    });

    it('should 201 update ok', function (done) {
      mm(userService, 'update', function* () {
        return {rev: '2-newrev'};
      });
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest10/-rev/:1-123')
      .set('authorization', 'basic ' + Buffer.from('cnpmjstest10:cnpmjstest10').toString('base64'))
      .send({
        name: 'cnpmjstest10',
        password: 'cnpmjstest10',
        email: 'cnpmjstest10@cnpmjs.org',
        rev: '1-123'
      })
      .expect(201, done);
    });
  });
});
