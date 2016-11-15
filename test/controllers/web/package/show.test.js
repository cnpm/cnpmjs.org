'use strict';

var should = require('should');
var request = require('supertest-as-promised');
var mm = require('mm');
var config = require('../../../../config');
var app = require('../../../../servers/web');
var registry = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('test/controllers/web/package/show.test.js', () => {
  before(function (done) {
    var pkg = utils.getPackage('@cnpmtest/testmodule-web-show', '0.0.1', utils.admin);
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

  describe('GET /package/:name', function () {
    it('should get 200', function (done) {
      request(app.listen())
      .get('/package/@cnpmtest/testmodule-web-show')
      .expect(200)
      .expect('content-type', 'text/html; charset=utf-8')
      .expect(/testmodule-web-show/)
      .expect(/Maintainers/)
      .expect(/Dependencies/)
      .expect(/Downloads/, function (err, res) {
        should.not.exist(err);
        res.should.have.header('etag');
        res.text.should.containEql('<meta charset="utf-8">');
        done();
      });
    });

    it('should get scoped package', function (done) {
      request(app.listen())
      .get('/package/@cnpmtest/testmodule-web-show')
      .expect(200)
      .expect('content-type', 'text/html; charset=utf-8')
      .expect(/testmodule-web-show/)
      .expect(/Maintainers/)
      .expect(/Dependencies/)
      .expect(/Downloads/, function (err, res) {
        should.not.exist(err);
        res.should.have.header('etag');
        res.text.should.containEql('<meta charset="utf-8">');
        done();
      });
    });

    it('should get 404', function (done) {
      request(app)
      .get('/package/@cnpmtest/not-exist-module')
      .expect(404, done);
    });
  });

  describe('GET /package/:name/:version', function () {
    it('should 200 when get by version', function (done) {
      request(app)
      .get('/package/@cnpmtest/testmodule-web-show/0.0.1')
      .expect(200)
      .expect(/testmodule-web-show/)
      .expect(/Maintainers/)
      .expect(/Dependencies/)
      .expect(/Downloads/, done);
    });

    it('should 200 when get by tag', function (done) {
      request(app)
      .get('/package/@cnpmtest/testmodule-web-show/latest')
      .expect(200)
      .expect(/testmodule-web-show/)
      .expect(/Maintainers/)
      .expect(/Dependencies/)
      .expect(/Downloads/, done);
    });

    it('should 404 when get by version not exist', function (done) {
      request(app)
      .get('/package/@cnpmtest/testmodule-web-show/1.1.2')
      .expect(404, done);
    });

    it('should 404 when get by tag', function (done) {
      request(app)
      .get('/package/@cnpmtest/testmodule-web-show/notexisttag')
      .expect(404, done);
    });
  });

  describe('unpublished package', () => {
    before(done => {
      mm(config, 'syncModel', 'all');
      utils.sync('mk2testmodule', done);
    });

    it('should display unpublished info', () => {
      mm(config, 'syncModel', 'all');
      return request(app)
        .get('/package/mk2testmodule')
        .expect(200)
        .expect(/This package has been unpublished\./);
    });
  });

  describe('xss filter', function () {
    before(function (done) {
      var pkg = utils.getPackage('@cnpmtest/xss-test-ut', '0.0.1', utils.admin,
        null, '[xss link](javascript:alert(2)) \n\nfoo<script>alert(1)</script>/xss\'"&#');
      request(registry.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .end(done);
    });

    it('should filter xss content', function (done) {
      request(app.listen())
      .get('/package/@cnpmtest/xss-test-ut')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.text.should.not.containEql('<script>alert(1)</script>');
        res.text.should.not.containEql('alert(2)"');
        done();
      });
    });
  });

  describe('show npm package', () => {
    before(done => {
      mm(config, 'syncModel', 'exists');
      utils.sync('pedding', done);
    });

    it('should show pedding package info and contributors', () => {
      mm(config, 'syncModel', 'exists');
      return request(app)
        .get('/package/pedding')
        .expect(200)
        // https://github.com/cnpm/cnpmjs.org/issues/497
        .expect(/by <a href="\/\~fengmk2">fengmk2<\/a>/)
        // snyk link
        .expect(/<a class="badge-link" href="https:\/\/snyk\.io\/test\/npm\/pedding" target="_blank"><img title="Known Vulnerabilities" src="https:\/\/snyk\.io\/test\/npm\/pedding\/badge\.svg\?style=flat-square"><\/a>/)
        .expect(/pedding/);
    });
  });
});
