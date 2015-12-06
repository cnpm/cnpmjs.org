/*!
 * cnpmjs.org - test/controllers/web/badge.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  ibigbug <xiaobayuwei@gmail.com>
 */

'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var app = require('../../../servers/web');

describe('controllers/web/admin/index.js', function() {
  it('should render index when logged in', function(done) {
    request(app)
      .get('/admin/')
      .set('authorization', 'basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64'))
      .expect(/react-content/, done);
  });
});
