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
var path = require('path');
var mysql = require('../../../common/mysql');
var app = require('../../../servers/web');
var registry = require('../../../servers/registry');
var pkg = require('../../../controllers/web/package');

var fixtures = path.join(path.dirname(path.dirname(__dirname)), 'fixtures');

describe('controllers/web/package.test.js', function () {
  var baseauth = 'Basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64');

  before(function (done) {
    registry.listen(0, function () {
      var pkg = require(path.join(fixtures, 'package_and_tgz.json'));
      request(registry)
      .put('/' + pkg.name)
      .set('authorization', baseauth)
      .send(pkg)
      .expect(201, function () {
        app.listen(0, done);
      });
    });
  });

  after(function (done) {
    app.close(done);
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

  describe('GET /package/:name', function (done) {
    it('should get 200', function (done) {
      request(app)
      .get('/package/mk2testmodule')
      .expect(200)
      // .expect('content-encoding', 'gzip')
      .expect('content-type', 'text/html; charset=utf-8')
      .expect(/<div id="package">/)
      .expect(/<th>Maintainers<\/th>/)
      .expect(/<th>Version<\/th>/, function (err, res) {
        should.not.exist(err);
        res.should.have.header('etag');
        res.text.should.containEql('<meta charset="utf-8">');
        done();
      });
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
      .get('/package/mk2testmodule/0.0.1')
      .expect(200)
      .expect(/<div id="package">/)
      .expect(/<th>Maintainers<\/th>/)
      .expect(/<th>Version<\/th>/, done);
    });

    it('should 200 when get by tag', function (done) {
      request(app)
      .get('/package/mk2testmodule/latest')
      .expect(200)
      .expect(/<div id="package">/)
      .expect(/<th>Maintainers<\/th>/)
      .expect(/<th>Version<\/th>/, done);
    });

    it('should 404 when get by version not exist', function (done) {
      request(app)
      .get('/package/mk2testmodule/1.1.2')
      .expect(404, done);
    });

    it('should 404 when get by tag', function (done) {
      request(app)
      .get('/package/mk2testmodule/notexisttag')
      .expect(404, done);
    });
  });

  describe('GET　/browse/keyword/:word', function () {
    it('should list by keyword ok', function (done) {
      request(app)
      .get('/browse/keyword/mk2testmodule')
      .expect(200)
      .expect(/Packages match/, done);
    });

    it('should list by keyword with json ok', function (done) {
      request(app)
      .get('/browse/keyword/mk2testmodule?type=json')
      .expect(200)
      .expect('content-type', 'application/json; charset=utf-8', done);
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
      .expect(/Internal Server Error/, done);
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

      p = {license: ['http://foo/MIT']};
      pkg.setLicense(p);
      p.license.should.have.keys('name', 'url');
      p.license.should.eql({
        name: 'http://foo/MIT',
        url: 'http://foo/MIT'
      });

      p = {license: {name: 'mit', url: 'http://foo/mit'}};
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
