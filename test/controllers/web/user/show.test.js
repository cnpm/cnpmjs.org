/*!
 * cnpmjs.org - test/controllers/web/user/show.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var mm = require('mm');
var request = require('supertest');
var assert = require('assert');
var app = require('../../../../servers/web');
var config = require('../../../../config');
var userService = require('../../../../services/user');

describe('controllers/web/user/show.test.js', function () {
  afterEach(mm.restore);

  describe('GET /~:name', function () {
    it('should get 200', function (done) {
      request(app)
      .get('/~cnpmjstest10')
      .expect(200)
      .expect('content-type', 'text/html; charset=utf-8')
      .expect(/<div id="profile">/)
      .expect(/Packages by/, done);
    });

    it('should get 404', function (done) {
      request(app)
      .get('/~not_exist_user')
      .expect(404, done);
    });

    it('should get not eixst user but have modules 200', function (done) {
      request(app)
      .get('/~cnpmjstest101')
      .expect(200)
      .expect(/<div id="profile">/)
      .expect(/Packages by/, done);
    });

    it('should 200 when config.customUserService = true', function (done) {
      mm(config, 'customUserService', true);
      mm(userService, 'get', function* () {
        return {
          login: 'cnpmjstest101111-mockuser',
          email: 'cnpmjstest101111-mockuser@cnpmjs.org',
          name: 'cnpmjstest101111-mockuser fullname',
          avatar_url: 'avatar_url',
          html_url: 'html_url',
          im_url: '',
          site_admin: false,
          scopes: ['@test-user-scope']
        };
      });

      request(app)
      .get('/~cnpmjstest101111-mockuser')
      .expect(200)
      .expect('content-type', 'text/html; charset=utf-8')
      .expect(/<div id="profile">/)
      .expect(/Packages by/, done);
    });

    it('should obfuscate user email address', function (done) {
      request(app)
        .get('/~cnpmjstest10')
        .expect(200)
        .then(function (res) {
          assert(res.text.includes('fengmk2@gmail.com') === false);

          // he.enclde('fengmk2@gmail.com') ↓
          assert(res.text.includes('&#x66;&#x65;&#x6E;&#x67;&#x6D;&#x6B;&#x32;&#x40;&#x67;&#x6D;&#x61;&#x69;&#x6C;&#x2E;&#x63;&#x6F;&#x6D;'));
          assert(res.headers['x-custom-web-middleware'] === 'true');
          assert(res.headers['x-custom-web-app-models'] === 'true');
          done()
        });
    });
  });
});
