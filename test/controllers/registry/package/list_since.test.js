/**!
 * cnpmjs.org - test/controllers/registry/package/list_since.test.js
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
var utils = require('../../../utils');

describe('controllers/registry/package/list_since.test.js', function () {
  afterEach(mm.restore);

  before(function (done) {
    var pkg = utils.getPackage('@cnpmtest/testmodule-list_since', '0.0.1', utils.admin);
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  describe('GET /-/all/since', function () {
    it('should 200', function (done) {
      request(app)
      .get('/-/all/since?stale=update_after&startkey=' + (Date.now() - 10000))
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.be.an.Object;
        res.body._updated.should.be.a.Number;
        Object.keys(res.body).length.should.above(1);
        res.body['@cnpmtest/testmodule-list_since'].should.equal(true);
        done();
      });
    });

    it('should show warnning log when startkey a week ago', function (done) {
      request(app)
      .get('/-/all/since?stale=update_after&startkey=' + (Date.now() - 1000000000))
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.be.an.Object;
        res.body._updated.should.be.a.Number;
        Object.keys(res.body).length.should.above(1);
        res.body['@cnpmtest/testmodule-list_since'].should.equal(true);
        done();
      });
    });

    it('should 400 when stale missing', function (done) {
      request(app)
      .get('/-/all/since')
      .expect({
        error: 'query_parse_error',
        reason: 'Invalid value for `stale`.'
      })
      .expect(400, done);
    });

    it('should 400 when startkey missing', function (done) {
      request(app)
      .get('/-/all/since?stale=update_after&startkey=')
      .expect({
        error: 'query_parse_error',
        reason: 'Invalid value for `startkey`.'
      })
      .expect(400, done);
    });

    it('should 400 when startkey isnt number', function (done) {
      request(app)
      .get('/-/all/since?stale=update_after&startkey=foo')
      .expect({
        error: 'query_parse_error',
        reason: 'Invalid value for `startkey`.'
      })
      .expect(400, done);
    });
  });
});
