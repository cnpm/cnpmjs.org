/**!
 * cnpmjs.org - test/middleware/auth.test.js
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

let request = require('supertest');
let app = require('../../servers/web');


describe('middleware/access_level.test.js', function() {
  before(function(done) {
    app.listen(0, done);
  });

  after(function (done) {
    app.close(done);
  });

  describe('access_level()', function() {
    it('can visit admin page when access_level is 1', function(done) {
        request(app)
          .get('/admin/user')
          .set('authorization', 'basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64'))
          .expect(200, done);
      });

    it('can not visit admin page when access_level less than 1', function(done) {
      request(app)
        .get('/admin')
        .expect(401, done);
    })
  });
})
