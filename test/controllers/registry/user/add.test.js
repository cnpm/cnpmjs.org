/**!
 * cnpmjs.org - test/controllers/registry/user/add.test.js
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
var app = require('../../../../servers/registry');
var config = require('../../../../config');
var userService = require('../../../../services/user');

describe('controllers/registry/user/add.test.js', function () {
  afterEach(mm.restore);

  describe('PUT /-user/org.couchdb.user:name', function () {
    it('should 404 when without a name', function (done) {
      request(app.listen())
      .put('/-/user/org.couchdb.user:')
      .expect(404, done);
    });

    it('should 422 when params error', function (done) {
      request(app.listen())
      .put('/-/user/org.couchdb.user:name')
      .send({name: 'name'})
      .expect(422, done);
    });

    it('should 409 when already exist', function (done) {
      mm(userService, 'get', function* () {
        return {name: 'name'};
      });
      request(app)
      .put('/-/user/org.couchdb.user:name')
      .send({
        name: 'name',
        password: 'password',
        email: 'email'
      })
      .expect(409, done);
    });

    it('should 201 when user.add ok', function (done) {
      mm(userService, 'get', function* () {
        return null;
      });
      mm(userService, 'add', function* () {
        return {rev: '1-123'};
      });
      request(app)
      .put('/-/user/org.couchdb.user:name')
      .send({
        name: 'name',
        password: 'password',
        email: 'email'
      })
      .expect(201, done);
    });

    it('should 422 add user without email', function (done) {
      mm(userService, 'get', function* () {
        return null;
      });
      mm(userService, 'add', function* () {
        return {rev: '1-123'};
      });
      request(app)
      .put('/-/user/org.couchdb.user:name')
      .send({
        name: 'name',
        password: 'password'
      })
      .expect(422, done);
    });

    it('should login without email ok', function (done) {
      mm(userService, 'authAndSave', function* () {
        return {login: 'name'};
      });
      request(app)
      .put('/-/user/org.couchdb.user:name')
      .send({
        name: 'name',
        password: 'password'
      })
      .expect(201, done);
    });
  });

  describe('config.customUserSerivce = true', function () {
    beforeEach(function () {
      mm(config, 'customUserService', true);
    });

    it('should 422 when password missing', function (done) {
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest10-not-exists')
      .send({
        name: 'cnpmjstest10-not-exists',
        password: '',
        email: 'cnpmjstest10@cnpmjs.org'
      })
      .expect({
        error: 'paramError',
        reason: 'params missing, name, email or password missing.'
      })
      .expect(422, done);
    });

    it('should 201 login success', function (done) {
      mm(userService, 'auth', function* () {
        return {
          "login": "cnpmjstest11111",
          "email": "cnpmjstest11111@cnpmjs.org",
          "name": "Yuan Feng",
          "html_url": "http://fengmk2.github.com",
          "avatar_url": "https://avatars3.githubusercontent.com/u/156269?s=460",
          "im_url": "",
          "site_admin": false,
          "scopes": ["@org1", "@cnpmtest"]
        };
      });
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest11111')
      .send({
        name: 'cnpmjstest11111',
        password: 'cnpmjstest11111',
        email: 'cnpmjstest11111@cnpmjs.org'
      })
      .expect(201, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'id', 'rev');
        res.body.id.should.equal('org.couchdb.user:cnpmjstest11111');
        res.body.rev.should.match(/\d+\-cnpmjstest11111/);
        res.body.ok.should.equal(true);
        done();
      });
    });

    it('should 401 login fail', function (done) {
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest10-not-exists')
      .send({
        name: 'cnpmjstest10-not-exists',
        password: 'cnpmjstest10',
        email: 'cnpmjstest10@cnpmjs.org'
      })
      .expect({
        error: 'unauthorized',
        reason: 'Login fail, please check your login name and password'
      })
      .expect(401, done);
    });

    it('should show error json when userSerive.auth throw error', function (done) {
      mm(userService, 'auth', function* () {
        var err = new Error('mock user service auth error, please visit http://ooxx.net/user to sigup first');
        err.name = 'UserSeriveAuthError';
        err.status = 401;
        throw err;
      });

      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest10')
      .send({
        name: 'cnpmjstest10',
        password: 'cnpmjstest10',
        email: 'cnpmjstest10@cnpmjs.org'
      })
      .expect({
        error: 'UserSeriveAuthError',
        reason: 'mock user service auth error, please visit http://ooxx.net/user to sigup first'
      })
      .expect(401, done);
    });
  });
});
