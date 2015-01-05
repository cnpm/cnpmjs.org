/*!
 * cnpmjs.org - test/controllers/web/package/show.test.js
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
var SyncModuleWorker = require('../../../../controllers/sync_module_worker');
var utils = require('../../../utils');

describe('controllers/web/package/show.test.js', function () {
  before(function (done) {
    var pkg = utils.getPackage('testmodule-web-show', '0.0.1', utils.admin);
    pkg.versions['0.0.1'].dependencies = {
      bytetest: '~0.0.1',
      mocha: '~1.0.0'
    };
    request(registry.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, function (err) {
      should.not.exist(err);
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
  });

  afterEach(mm.restore);

  describe('GET /package/:name', function () {
    it('should get 200', function (done) {
      request(app.listen())
      .get('/package/testmodule-web-show')
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
      .get('/package/not-exist-module')
      .expect(404, done);
    });
  });

  describe('GET /package/:name/:version', function () {
    it('should 200 when get by version', function (done) {
      request(app)
      .get('/package/testmodule-web-show/0.0.1')
      .expect(200)
      .expect(/testmodule-web-show/)
      .expect(/Maintainers/)
      .expect(/Dependencies/)
      .expect(/Downloads/, done);
    });

    it('should 200 when get by tag', function (done) {
      request(app)
      .get('/package/testmodule-web-show/latest')
      .expect(200)
      .expect(/testmodule-web-show/)
      .expect(/Maintainers/)
      .expect(/Dependencies/)
      .expect(/Downloads/, done);
    });

    it('should 404 when get by version not exist', function (done) {
      request(app)
      .get('/package/testmodule-web-show/1.1.2')
      .expect(404, done);
    });

    it('should 404 when get by tag', function (done) {
      request(app)
      .get('/package/testmodule-web-show/notexisttag')
      .expect(404, done);
    });
  });

  describe('unpublished package', function () {
    before(function (done) {
      var worker = new SyncModuleWorker({
        name: ['tnpm'],
        username: 'fengmk2'
      });

      worker.start();
      worker.on('end', function () {
        var names = worker.successes.concat(worker.fails);
        names.sort();
        names.should.eql(['tnpm']);
        done();
      });
    });

    it('should display unpublished info', function (done) {
      request(app)
      .get('/package/tnpm')
      .expect(200)
      .expect(/This package has been unpublished\./, done);
    });
  });

  describe('xss filter', function () {
    before(function (done) {
      var pkg = utils.getPackage('xss-test-ut', '0.0.1', utils.admin, null, '[xss link](javascript:alert(2)) \n\nfoo<script>alert(1)</script>/xss\'"&#');
      request(registry.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .end(done);
    });

    it('should filter xss content', function (done) {
      request(app.listen())
      .get('/package/xss-test-ut')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.text.should.not.containEql('<script>alert(1)</script>');
        res.text.should.not.containEql('alert(2)"');
        done();
      });
    });
  });

  describe('show npm package', function () {
    before(function (done) {
      var worker = new SyncModuleWorker({
        name: ['pedding'],
        username: 'fengmk2',
        noDep: true
      });

      worker.start();
      worker.on('end', function () {
        var names = worker.successes.concat(worker.fails);
        names.sort();
        names.should.eql(['pedding']);
        done();
      });
    });

    it('should show pedding package info and contributors', function (done) {
      request(app)
      .get('/package/pedding')
      .expect(200)
      // https://github.com/cnpm/cnpmjs.org/issues/497
      .expect(/by <a href="\/\~fengmk2">fengmk2<\/a>/)
      .expect(/pedding/, done);
    });
  });
});
