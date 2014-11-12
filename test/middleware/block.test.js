/**!
 * cnpmjs.org - test/middleware/block.test.js
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

var request = require('supertest');
var app = require('../../servers/registry');
var web = require('../../servers/web');

describe('middleware/block.test.js', function () {
  it('should registry 403 when user-agent is Ruby', function (done) {
    request(app.listen())
    .get('/')
    .set('User-Agent', 'Ruby')
    .expect({
      message: 'forbidden Ruby user-agent, ip: ::ffff:127.0.0.1'
    })
    .expect(403, done);
  });

  it('should web 403 when user-agent is Ruby', function (done) {
    request(web.listen())
    .get('/')
    .set('User-Agent', 'Ruby')
    .expect({
      message: 'forbidden Ruby user-agent, ip: ::ffff:127.0.0.1'
    })
    .expect(403, done);
  });
});
