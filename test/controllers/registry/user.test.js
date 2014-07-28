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
var config = require('../../../config');
var UserService = require('../../../services/user');

describe('controllers/registry/user.test.js', function () {
  before(function (done) {
    app = app.listen(0, done);
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
      mm(user, 'get', function* () {
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

    it('should 500 when user.get error', function (done) {
      mm(user, 'get', function* () {
        throw new Error('mock User.get error');
      });
      request(app)
      .put('/-/user/org.couchdb.user:name')
      .send({
        name: 'name',
        password: 'password',
        email: 'email'
      })
      .expect(500, done);
    });

    it('should 201 when user.add ok', function (done) {
      mm(user, 'get', function* () {
        return null;
      });
      mm(user, 'add', function* () {
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
      request(app)
      .put('/-/user/org.couchdb.user:cnpmjstest10')
      .send({
        name: 'cnpmjstest10',
        password: 'cnpmjstest10',
        email: 'cnpmjstest10@cnpmjs.org'
      })
      .expect(201, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'id', 'rev');
        res.body.id.should.equal('org.couchdb.user:cnpmjstest10');
        res.body.rev.should.match(/\d+\-cnpmjstest10/);
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
  });

  describe('config.customUserService = true', function () {
    beforeEach(function () {
      mm(config, 'customUserService', true);
    });

    afterEach(mm.restore);

    it('should show custom user info: admin', function (done) {
      mm(UserService, 'get', function* () {
        return {
          login: 'mock_custom_user',
          email: 'mock_custom_user@cnpmjs.org',
          name: 'mock_custom_user fullname',
          avatar_url: 'avatar_url',
          html_url: 'html_url',
          im_url: '',
          site_admin: true,
          scopes: ['@test-user-scope']
        };
      });
      request(app)
      .get('/-/user/org.couchdb.user:mock_custom_user')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var user = res.body;
        delete user._cnpm_meta.gmt_create;
        delete user._cnpm_meta.gmt_modified;
        delete user._cnpm_meta.id;
        delete user.date;

        user.should.eql({
          _id: 'org.couchdb.user:mock_custom_user',
          _rev: '1-mock_custom_user',
          name: 'mock_custom_user',
          email: 'mock_custom_user@cnpmjs.org',
          type: 'user',
          roles: [],
          // date: '2014-07-28T16:46:36.000Z',
          avatar: 'avatar_url',
          fullname: 'mock_custom_user fullname',
          homepage: 'html_url',
          _cnpm_meta:
           {
            //  id: 4,
             npm_user: false,
             custom_user: true,
            //  gmt_create: '2014-07-28T16:46:36.000Z',
            //  gmt_modified: '2014-07-28T16:46:36.000Z',
             admin: true,
             scopes: [ '@test-user-scope' ] }
        });
        done();
      });
    });

    it('should show custom user info: not admin', function (done) {
      mm(UserService, 'get', function* () {
        return {
          login: 'mock_custom_not_admin_user',
          email: 'mock_custom_not_admin_user@cnpmjs.org',
          name: 'mock_custom_not_admin_user fullname',
          avatar_url: 'avatar_url',
          html_url: 'html_url',
          im_url: '',
          site_admin: false,
          scopes: ['@test-user-scope']
        };
      });
      request(app)
      .get('/-/user/org.couchdb.user:mock_custom_not_admin_user')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var user = res.body;
        delete user._cnpm_meta.gmt_create;
        delete user._cnpm_meta.gmt_modified;
        delete user._cnpm_meta.id;
        delete user.date;

        user.should.eql({
          _id: 'org.couchdb.user:mock_custom_not_admin_user',
          _rev: '1-mock_custom_not_admin_user',
          name: 'mock_custom_not_admin_user',
          email: 'mock_custom_not_admin_user@cnpmjs.org',
          type: 'user',
          roles: [],
          // date: '2014-07-28T16:46:36.000Z',
          avatar: 'avatar_url',
          fullname: 'mock_custom_not_admin_user fullname',
          homepage: 'html_url',
          _cnpm_meta:
           {
            //  id: 5,
             npm_user: false,
             custom_user: true,
            //  gmt_create: '2014-07-28T16:46:36.000Z',
            //  gmt_modified: '2014-07-28T16:46:36.000Z',
             admin: false,
             scopes: [ '@test-user-scope' ] }
        });
        done();
      });
    });
  });
});
