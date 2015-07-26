/**!
 * cnpmjs.org - test/controllers/registry/user/show.test.js
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
var utils = require('../../../utils');

describe('controllers/registry/user/show.test.js, GET /-/user/org.couchdb.user:name', function () {
  afterEach(mm.restore);

  before(function (done) {
    utils.sync('pedding', done);
  });

  beforeEach(function () {
    mm(config, 'customUserService', false);
  });

  it('should return user info', function (done) {
    request(app.listen())
    .get('/-/user/org.couchdb.user:cnpmjstest101')
    .expect(200, function (err, res) {
      should.not.exist(err);
      res.body.should.have.keys('_id', '_rev', 'name', 'email', 'type',
        '_cnpm_meta', 'roles', 'date');
      res.body.name.should.equal('cnpmjstest101');
      done();
    });
  });

  it('should return npm user info', function (done) {
    request(app.listen())
    .get('/-/user/org.couchdb.user:fengmk2')
    .expect(200, function (err, res) {
      should.not.exist(err);
      res.body.name.should.equal('fengmk2');
      // res.body.github.should.equal('fengmk2');
      res.body._cnpm_meta.should.have.keys('id', 'npm_user', 'custom_user',
        'gmt_modified', 'gmt_create');
      res.body._cnpm_meta.npm_user.should.equal(true);
      res.body._cnpm_meta.custom_user.should.equal(false);
      done();
    });
  });

  it('should return 404 when not eixst', function (done) {
    request(app.listen())
    .get('/-/user/org.couchdb.user:cnpmjstest_notexist')
    .expect(404, done);
  });

  describe('config.customUserSerivce = true', function () {
    beforeEach(function () {
      mm(config, 'customUserService', true);
    });

    it('should show npm user', function (done) {
      request(app.listen())
      .get('/-/user/org.couchdb.user:fengmk2')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.name.should.equal('fengmk2');
        done();
      });
    });

    it('should show custom user info: admin', function (done) {
      mm(userService, 'get', function* () {
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
        delete user._cnpm_meta;
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
          scopes: [ '@test-user-scope' ],
          site_admin: true
        });
        done();
      });
    });

    it('should show custom user info: not admin', function (done) {
      mm(userService, 'get', function* () {
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
        delete user._cnpm_meta;
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
          scopes: [ '@test-user-scope' ],
          site_admin: false,
        });
        done();
      });
    });
  });
});
