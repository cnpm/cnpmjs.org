/*!
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
var app = require('../../../servers/registry');

describe('controllers/registry/user.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });
  after(function (done) {
    app.close(done);
  });

  describe('GET /-/user/org.couchdb.user:name', function () {
    it('should return user info', function (done) {
      request(app)
      .get('/-/user/org.couchdb.user:cnpmjstest1')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('_id', '_rev', 'name', 'email', 'type', 'roles', 'date');
        res.body.name.should.equal('cnpmjstest1');
        done();
      });
    });
  });
});
