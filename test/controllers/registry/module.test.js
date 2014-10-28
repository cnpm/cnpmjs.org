/**!
 * cnpmjs.org - test/controllers/registry/module.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var should = require('should');
var request = require('supertest');
var mm = require('mm');
var pedding = require('pedding');
var config = require('../../../config');
var app = require('../../../servers/registry');
var Npm = require('../../../services/npm');
var SyncModuleWorker = require('../../../controllers/sync_module_worker');
var utils = require('../../utils');

var fixtures = path.join(path.dirname(path.dirname(__dirname)), 'fixtures');

describe('controllers/registry/module.test.js', function () {
  before(function (done) {
    app = app.listen(0, function () {
      done = pedding(2, done);
      // name: mk2testmodule
      var pkg = utils.getPackage('mk2testmodule', '0.0.1', utils.admin);

      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err) {
        should.not.exist(err);
        pkg = utils.getPackage('mk2testmodule', '0.0.2', utils.admin);
        // publish 0.0.2
        request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, done);
      });

      // testputmodule@0.1.9
      var testpkg = utils.getPackage('testputmodule', '0.1.9', utils.admin);

      request(app)
      .put('/' + testpkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });
  });

  afterEach(mm.restore);

  describe('sync source npm package', function () {
    var logId;
    it('should put /:name/sync success', function (done) {
      mm.data(Npm, 'get', require(path.join(fixtures, 'utility.json')));
      request(app)
      .put('/pedding/sync')
      .set('authorization', utils.adminAuth)
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'logId');
        logId = res.body.logId;
        done();
      });
    });

    it('should get sync log', function (done) {
      request(app)
      .get('/pedding/sync/log/' + logId)
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'log');
        done();
      });
    });
  });

  describe('GET /:name unpublished', function () {
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

    it('should show unpublished info', function (done) {
      request(app)
      .get('/tnpm')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect(404, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          _id: 'tnpm',
         name: 'tnpm',
         time: {
           modified: '2014-06-05T01:33:59.668Z',
           unpublished:
          { name: 'fengmk2',
           time: '2014-06-05T01:33:59.668Z',
           tags: { latest: '0.3.10' },
           maintainers:
           [ { name: 'fengmk2', email: 'fengmk2@gmail.com' },
            { name: 'dead_horse', email: 'dead_horse@qq.com' } ],
           description: 'npm client for alibaba private npm registry',
           versions:
           [ '0.0.1',
            '0.0.2',
            '0.0.3',
            '0.0.4',
            '0.1.0',
            '0.1.1',
            '0.1.2',
            '0.1.3',
            '0.1.4',
            '0.1.5',
            '0.1.8',
            '0.1.9',
            '0.2.0',
            '0.2.1',
            '0.2.2',
            '0.2.3',
            '0.2.4',
            '0.3.0',
            '0.3.1',
            '0.3.2',
            '0.3.3',
            '0.3.4',
            '0.3.5',
            '0.3.6',
            '0.3.7',
            '0.3.8',
            '0.3.9',
            '0.3.10' ] } },
          _attachments: {}
        });
        done();
      });
    });
  });

  describe('GET /:name get module package info', function () {
    var etag;

    it('should return module info and etag', function (done) {
      request(app)
      .get('/mk2testmodule')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect(200, function (err, res) {
        should.not.exist(err);
        // should have etag
        res.headers.should.have.property('etag');
        etag = res.headers.etag;
        etag.should.match(/^"\d{13}"$/);
        res.body.should.have.keys('_id', '_rev', 'name', 'description',
          'versions', 'dist-tags', 'readme', 'maintainers',
          'time', 'author',
          // 'repository',
          '_attachments',
          'users',
          // 'readmeFilename',
          // 'homepage',
          // 'bugs',
          'license');
        res.body.name.should.equal('mk2testmodule');
        res.body.versions[Object.keys(res.body.versions)[0]]
          .dist.tarball.should.containEql('/mk2testmodule/download');
        res.body.time.should.have.property('modified');
        res.body.time.modified.should.be.a.String;
        res.body.time.should.have.property('created');
        res.body.time.created.should.be.a.String;
        // should not contains authSession cookie
        should.not.exist(res.headers['set-cookie']);
        done();
      });
    });

    it('should return module info and gzip when accept-encoding=gzip', function (done) {
      request(app)
      .get('/mk2testmodule')
      .set('accept-encoding', 'gzip')
      // .expect('content-encoding', 'gzip')
      .expect(200, function (err, res) {
        // console.log(res.headers)
        should.not.exist(err);
        // should have etag
        res.headers.should.have.property('etag');
        etag = res.headers.etag;
        res.body.should.have.keys('_id', '_rev', 'name', 'description',
          'versions', 'dist-tags', 'readme', 'maintainers',
          'time', 'author',
          // 'repository',
          '_attachments',
          'users',
          // 'readmeFilename',
          // 'homepage', 'bugs',
          'license');
        res.body.name.should.equal('mk2testmodule');
        res.body.versions[Object.keys(res.body.versions)[0]]
          .dist.tarball.should.containEql('/mk2testmodule/download');
        should.not.exist(res.headers['set-cookie']);
        done();
      });
    });

    it('should 304 when etag match', function (done) {
      request(app)
      .get('/mk2testmodule')
      .set('If-None-Match', etag)
      .expect(304, done);
    });
  });

  describe('GET /:name/:(version|tag)', function () {
    it('should return module@version info', function (done) {
      request(app)
      .get('/mk2testmodule/0.0.1')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var body = res.body;
        body.name.should.equal('mk2testmodule');
        body.version.should.match(/\d+\.\d+\.\d+/);
        body._id.should.match(/mk2testmodule@\d+\.\d+\.\d+/);
        body.dist.tarball.should.match(/mk2testmodule\-\d+\.\d+\.\d+\.tgz/);
        body.should.have.property('_cnpm_publish_time');
        body._cnpm_publish_time.should.be.a.Number;
        body.should.have.property('_publish_on_cnpm', true);
        done();
      });
    });

    it('should return module@tag info', function (done) {
      request(app)
      .get('/mk2testmodule/latest')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var body = res.body;
        body.name.should.equal('mk2testmodule');
        body.version.should.equal('0.0.2');
        body._id.should.equal('mk2testmodule@0.0.2');
        body.dist.tarball.should.containEql('/mk2testmodule/download/mk2testmodule-0.0.2.tgz');
        done();
      });
    });
  });

  describe('PUT /:name publish new flow addPackageAndDist()', function () {
    it('should publish with tgz base64, addPackageAndDist()', function (done) {
      done = pedding(2, done);
      var pkg = utils.getPackage('testpublishmodule-new-add', '0.0.2');
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'rev');
        res.body.ok.should.equal(true);

        // upload again should 403
        request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(403, function (err, res) {
          should.not.exist(err);
          res.body.should.eql({
            error: 'forbidden',
            reason: 'cannot modify pre-existing version: 0.0.2'
          });
          done();
        });

        // maintainers should exists
        mysql.query('SELECT user FROM module_maintainer WHERE name=?', ['testpublishmodule-new-add'],
        function (err, rows) {
          should.not.exist(err);
          rows.length.should.above(0);
          rows.should.eql([ { user: 'cnpmjstest10' } ]);
          done();
        });
      });
    });

    it('should 403 when user is not maintainer', function (done) {
      mm(config, 'enablePrivate', false);
      var pkg = utils.getPackage('@cnpmtest/testpublishmodule-not-maintainer', '0.0.1');
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'rev');
        res.body.ok.should.equal(true);

        // upload again should 403
        request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.otherUserAuth)
        .send(pkg)
        .expect(403, function (err, res) {
          should.not.exist(err);
          res.body.should.eql({
            error: 'forbidden user',
            reason: 'cnpmjstest101 not authorized to modify @cnpmtest/testpublishmodule-not-maintainer, please contact maintainers: cnpmjstest10'
          });
          done();
        });
      });
    });

    it('should version_error when versions missing', function (done) {
      var pkg = utils.getPackage('version_missing_module');
      delete pkg.versions;
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(400, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          error: 'version_error',
          reason: 'version undefined not found'
        });
        done();
      });
    });

    it('should 400 when dist-tags empty', function (done) {
      var pkg = utils.getPackage('dist-tags-empty');
      pkg['dist-tags'] = {};
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(400, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          error: 'invalid',
          reason: 'dist-tags should not be empty'
        });
        done();
      });
    });

    it('should publish with beta tag addPackageAndDist()', function (done) {
      var version = '0.1.1';
      var pkg = utils.getPackage('publish-with-beta-tag', version);
      pkg['dist-tags'] = {
        beta: version
      };
      request(app)
      .del('/' + pkg.name + '/-rev/1')
      .set('authorization', utils.adminAuth)
      .end(function (err, res) {
        should.not.exist(err);

        request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, function (err, res) {
          should.not.exist(err);
          res.body.should.have.keys('ok', 'rev');
          res.body.ok.should.equal(true);
          // should auto set latest
          request(app)
          .get('/' + pkg.name)
          .expect(200, function (err, res) {
            should.not.exist(err);
            res.body['dist-tags'].should.eql({
              beta: version,
              latest: version
            });

            // update new beta
            pkg['dist-tags'] = {
              beta: '10.10.1'
            };
            pkg.versions = {
              '10.10.1': pkg.versions[version]
            };
            request(app)
            .put('/' + pkg.name)
            .set('authorization', utils.adminAuth)
            .send(pkg)
            .expect(201, function (err, res) {
              should.not.exist(err);
              res.body.should.have.keys('ok', 'rev');
              res.body.ok.should.equal(true);
              // should auto set latest
              request(app)
              .get('/' + pkg.name)
              .expect(200, function (err, res) {
                should.not.exist(err);
                res.body['dist-tags'].should.eql({
                  beta: '10.10.1',
                  latest: version
                });
                done();
              });
            });

          });
        });
      });
    });
  });

  describe('GET /-/all', function () {
    it('should get 200', function (done) {
      request(app)
      .get('/-/all')
      .expect(200, function (err, res) {
        res.body.should.be.an.Object;
        res.body._updated.should.be.a.Number;
        Object.keys(res.body).length.should.be.above(1);
        done();
      });
    });
  });

  describe('GET /-/all/since', function () {
    it('should get 200', function (done) {
      request(app)
      .get('/-/all/since?stale=update_after&startkey=0')
      .expect(200, function (err, res) {
        should.not.exist(err);
        should.exist(res.body);
        res.body.should.be.an.Object;
        res.body._updated.should.be.a.Number;
        var keys = Object.keys(res.body);
        keys.length.should.be.above(1);
        done();
      });
    });

    it('should get 200 but response empty', function (done) {
      request(app)
      .get('/-/all/since?stale=update_after&startkey=' + (Date.now() * 2))
      .expect(200, function (err, res) {
        should.not.exist(err);
        should.exist(res.body);
        res.body.should.be.an.Object;
        res.body._updated.should.be.a.Number;
        res.body.should.eql({
          _updated: res.body._updated
        });
        done();
      });
    });
  });

  describe('GET /-/short', function () {
    it('should get 200', function (done) {
      request(app)
      .get('/-/short')
      .expect(200, function (err, res) {
        res.body.should.be.an.Array;
        res.body.length.should.be.above(1);
        done();
      });
    });
  });
});
