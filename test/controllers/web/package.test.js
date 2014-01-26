/*!
 * cnpmjs.org - test/controllers/web/package.test.js
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
var mysql = require('../../../common/mysql');
var app = require('../../../servers/web');
var pkg = require('../../../controllers/web/package');

describe('controllers/web/package.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });
  after(function (done) {
    app.close(done);
  });

  afterEach(mm.restore);

  describe('GET /_list/search/search', function () {
    it('should search with "c"', function (done) {
      request(app)
      .get('/_list/search/search?startkey="c"&limit=2')
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

    it('should search with c', function (done) {
      request(app)
      .get('/_list/search/search?startkey=c&limit=2')
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

  describe('GET /package/:name', function (done) {
    it('should get 200', function (done) {
      request(app)
      .get('/package/cutter')
      .expect(200)
      .expect(/<div id="package">/)
      .expect(/<th>Maintainers<\/th>/)
      .expect(/<th>Version<\/th>/, done);
    });

    it('should get 404', function (done) {
      request(app)
      .get('/package/not-exist-module')
      .expect(404, done);
    });
  });

  describe('GET /package/:name/:version', function (done) {
    it('should 200 when get by version', function (done) {
      request(app)
      .get('/package/cutter/0.0.2')
      .expect(200)
      .expect(/<div id="package">/)
      .expect(/<th>Maintainers<\/th>/)
      .expect(/<th>Version<\/th>/, done);
    });

    it('should 200 when get by tag', function (done) {
      request(app)
      .get('/package/cutter/latest')
      .expect(200)
      .expect(/<div id="package">/)
      .expect(/<th>Maintainers<\/th>/)
      .expect(/<th>Version<\/th>/, done);
    });
    it('should 404 when get by version not exist', function (done) {
      request(app)
      .get('/package/cutter/1.1.2')
      .expect(404, done);
    });

    it('should 404 when get by tag', function (done) {
      request(app)
      .get('/package/cutter/notexisttag')
      .expect(404, done);
    });
  });

  describe('GET　/browse/keyword/:word', function () {
    it('should list by keyword ok', function (done) {
      request(app)
      .get('/browse/keyword/cnpm')
      .expect(200)
      .expect(/Packages match/, done);
    });

    it('should list no match ok', function (done) {
      request(app)
      .get('/browse/keyword/notexistpackage')
      .expect(200)
      .expect(/Can not found package match notexistpackage/, done);
    });

    it('should 500 when mysql error', function (done) {
      mm.error(mysql, 'query');
      request(app)
      .get('/browse/keyword/notexistpackage')
      .expect(500)
      .expect(/MockError: mm mock error/, done);
    });
  });

  describe('setLicense()', function () {
    it('should only use the first license', function () {
      var p = {license: ['MIT']};
      pkg.setLicense(p);
      p.license.should.have.keys('name', 'url');
      p.license.should.eql({
        name: 'MIT',
        url: 'http://opensource.org/licenses/MIT'
      });

      var p = {license: ['http://foo/MIT']};
      pkg.setLicense(p);
      p.license.should.have.keys('name', 'url');
      p.license.should.eql({
        name: 'http://foo/MIT',
        url: 'http://foo/MIT'
      });

      var p = {license: {name: 'mit', url: 'http://foo/mit'}};
      pkg.setLicense(p);
      p.license.should.have.keys('name', 'url');
      p.license.should.eql({
        name: 'mit',
        url: 'http://foo/mit'
      });
    });
  });

  describe('GET /sync/:name', function (done) {
    it('should display ok', function (done) {
      request(app)
      .get('/sync/cutter')
      .expect(200)
      .expect(/Sync Package/)
      .expect(/Log/, done);
    });
  });
});
