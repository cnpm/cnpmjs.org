/*!
 * cnpmjs.org - test/controllers/web/package/list_privates.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var mm = require('mm');
var app = require('../../../../servers/web');
var config = require('../../../../config');

describe('controllers/web/package/list_privates.test.js', function () {
  afterEach(mm.restore);

  describe('GET /privates', function () {
    it('should response no private packages', function (done) {
      mm(config, 'scopes', ['@not-exists-scope-name']);
      request(app)
      .get('/privates')
      .expect(/Can not found private package/)
      .expect(200, done);
    });

    it('should response no private packages', function (done) {
      request(app)
      .get('/privates')
      .expect(/Private packages in this registry/)
      .expect(200, done);
    });
  });
});
