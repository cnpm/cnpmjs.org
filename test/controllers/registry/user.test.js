/**!
 * cnpmjs.org - test/controllers/registry/user.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var app = require('../../../servers/registry');
var user = require('../../../proxy/user');
var mysql = require('../../../common/mysql');

describe('controllers/registry/user.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });

  after(function (done) {
    app.close(done);
  });

  afterEach(mm.restore);

  describe('GET /-/user/org.couchdb.user:name', function () {
    it('should return user info', function (done) {
      request(app)
      .get('/-/user/org.couchdb.user:cnpmjstest10')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('_id', '_rev', 'name', 'email', 'type',
          '_cnpm_meta', 'roles', 'date');
        res.body.name.should.equal('cnpmjstest10');
        done();
      });
    });

    it.skip('should return npm user info', function (done) {
      request(app)
      .get('/-/user/org.couchdb.user:fengmk2')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.name.should.equal('fengmk2');
        res.body.github.should.equal('fengmk2');
        res.body._cnpm_meta.should.have.keys('id', 'npm_user', 'gmt_create',
          'gmt_modified', 'admin');
        res.body._cnpm_meta.admin.should.equal(true);
        done();
      });
    });

    it('should return 404 when not eixst', function (done) {
      request(app)
      .get('/-/user/org.couchdb.user:cnpmjstest_notexist')
      .expect(404, done);
    });

    it('should return 500 when mysql error', function (done) {
      mm.error(mysql, 'query', 'mock mysql error');
      request(app)
      .get('/-/user/org.couchdb.user:cnpmjstest1')
      .expect(500, done);
    });
  });

  describe('PUT /-user/org.couchdb.user:name', function () {
    it('should 404 when without a name', function (done) {
      request(app)
      .put('/-/user/org.couchdb.user:')
      .expect(404, done);
    });

    it('should 422 when params error', function (done) {
      request(app)
      .put('/-/user/org.couchdb.user:name')
      .send({name: 'name'})
      .expect(422, done);
    });

    it('should 409 when already exist', function (done) {
      mm.data(user, 'get', {name: 'name'});
      request(app)
      .put('/-/user/org.couchdb.user:name')
      .send({
        name: 'name',
        salt: 'salt',
        password_sha: 'password_sha',
        email: 'email'
      })
      .expect(409, done);
    });

    it('should 500 when user.get error', function (done) {
      mm.error(user, 'get', 'mock error');
      request(app)
      .put('/-/user/org.couchdb.user:name')
      .send({
        name: 'name',
        salt: 'salt',
        password_sha: 'password_sha',
        email: 'email'
      })
      .expect(500, done);
    });

    it('should 201 when user.add ok', function (done) {
      mm.empty(user, 'get');
      mm.data(user, 'add', {rev: '1-123'});
      request(app)
      .put('/-/user/org.couchdb.user:name')
      .send({
        name: 'name',
        salt: 'salt',
        password_sha: 'password_sha',
        email: 'email'
      })
      .expect(201, done);
    });
  });

  describe('POST /_session', function () {
    it('should 500 auth error by user.auth', function (done) {
      mm.error(user, 'auth', 'mock error');
      request(app)
      .post('/_session')
      .send({
        name: 'name',
        password: '123'
      })
      .expect(500, done);
    });

    it('should 401 auth fail by user.auth', function (done) {
      mm.empty(user, 'auth');
      request(app)
      .post('/_session')
      .send({
        name: 'name',
        password: '123'
      })
      .expect(401, done);
    });

    it('should 200 auth pass by user.auth', function (done) {
      mm.data(user, 'auth', {name: 'name'});
      request(app)
      .post('/_session')
      .send({
        name: 'name',
        password: '123'
      })
      .expect(200)
      .expect({
        ok: true,
        name: 'name',
        roles: []
      }, function (err, res) {
        should.not.exist(err);
        should.exist(res.headers['set-cookie']);
        res.headers['set-cookie'].join(';').should.containEql('AuthSession=');
        done();
      });
    });
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
      .set('authorization', 'basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64'))
      .expect(401, done);
    });

    it('should 500 when user.update error', function (done) {
      mm.error(user, 'update', 'mock error');
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest10/-rev/:1-123')
      .send({
        name: 'cnpmjstest10',
        password: 'cnpmjstest10',
        email: 'cnpmjstest10@cnpmjs.org'
      })
      .set('authorization', 'basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64'))
      .expect(500, done);
    });

    it('should 201 when req.body.rev error', function (done) {
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest10/-rev/:1-123')
      .set('authorization', 'basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64'))
      .send({
        name: 'cnpmjstest10',
        password: 'cnpmjstest10',
        email: 'cnpmjstest10@cnpmjs.org',
        rev: '1-123'
      })
      .expect(201, done);
    });

    it('should 201 update ok', function (done) {
      mm.data(user, 'update', {rev: '2-newrev'});
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest10/-rev/:1-123')
      .set('authorization', 'basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64'))
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
