/*!
 * cnpmjs.org - test/controllers/web/package/search_range.test.js
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

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var app = require('../../../../servers/web');
var registry = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('controllers/web/package/search_range.test.js', function () {
  before(function (done) {
    var pkg = utils.getPackage('@cnpmtest/testmodule-web-search_range', '0.0.1', utils.admin);
    pkg.versions['0.0.1'].dependencies = {
      bytetest: '~0.0.1',
      mocha: '~1.0.0',
      'testmodule-web-show': '0.0.1'
    };
    request(registry.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  afterEach(mm.restore);

  describe('GET /_list/search/search', function () {
    it('should search with "m"', function (done) {
      request(app)
      .get('/_list/search/search?startkey="m"&limit=2')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('rows');
        res.body.rows.length.should.above(0);
        res.body.rows.forEach(function (row) {
          row.should.have.keys('key', 'count', 'value');
          row.value.should.have.keys('name', 'description');
        });
        done();
      });
    });

    it('should search with m', function (done) {
      request(app)
      .get('/_list/search/search?startkey=m&limit=2')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('rows');
        res.body.rows.length.should.above(0);
        res.body.rows.forEach(function (row) {
          row.should.have.keys('key', 'count', 'value');
          row.value.should.have.keys('name', 'description');
        });
        done();
      });
    });

    it('should search return empty', function (done) {
      request(app)
      .get('/_list/search/search?startkey="cddddsdasdaasds"&limit=2')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({rows: []});
        done();
      });
    });
  });
});
