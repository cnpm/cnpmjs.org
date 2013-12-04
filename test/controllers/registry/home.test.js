/*!
 * cnpmjs.org - test/controllers/registry/home.test.js
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

describe('controllers/registry/home.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });
  after(function (done) {
    app.close(done);
  });

  describe('GET /', function () {
    it('should return total info', function (done) {
      request(app)
      .get('/')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.db_name.should.equal('registry');
        done();
      });
    });
  });
});
