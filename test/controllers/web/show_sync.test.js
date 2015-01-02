/*!
 * cnpmjs.org - test/controllers/web/show_sync.test.js
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
var app = require('../../../servers/web');

describe('controllers/web/show_sync.test.js', function () {
  describe('GET /sync/:name', function () {
    it('should display ok', function (done) {
      request(app.listen())
      .get('/sync/cutter')
      .expect(200)
      .expect(/Sync package/)
      .expect(/Log/, done);
    });
  });
});
