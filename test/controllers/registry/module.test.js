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
var thunkify = require('thunkify-wrap');
var should = require('should');
var request = require('supertest');
var mm = require('mm');
var pedding = require('pedding');
var config = require('../../../config');
var app = require('../../../servers/registry');
var Module = require('../../../proxy/module');
var Npm = require('../../../proxy/npm');
var controller = require('../../../controllers/registry/module');
var ModuleDeps = require('../../../proxy/module_deps');
var SyncModuleWorker = require('../../../proxy/sync_module_worker');
var utils = require('../../utils');
var mysql = require('../../../common/mysql');

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
      .put('/utility/sync')
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
      .get('/utility/sync/log/' + logId)
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

  describe('PUT /:name/-rev/id updateMaintainers()', function () {
    before(function (done) {
      request(app)
      .put('/mk2testmodule/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest10',
          email: 'cnpmjstest10@cnpmjs.org'
        }]
      })
      .set('authorization', utils.adminAuth)
      .expect({"ok":true,"id":"mk2testmodule","rev":"1"}, done);
    });

    it('should add new maintainers', function (done) {
      request(app)
      .put('/mk2testmodule/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest10',
          email: 'cnpmjstest10@cnpmjs.org'
        }, {
          name: 'cnpmjstest101',
          email: 'fengmk2@cnpmjs.org'
        }]
      })
      .set('authorization', utils.adminAuth)
      .expect(201)
      .expect({
        ok: true, id: 'mk2testmodule', rev: '1'
      }, function (err) {
        should.not.exist(err);
        done = pedding(2, done);
        // check maintainers update
        request(app)
        .get('/mk2testmodule')
        .expect(200, function (err, res) {
          should.not.exist(err);
          var pkg = res.body;
          pkg.maintainers.should.length(2);
          pkg.maintainers.should.eql(pkg.versions['0.0.1'].maintainers);
          pkg.maintainers.sort(function (a, b) {
            return a.name > b.name ? 1 : -1;
          });
          pkg.maintainers.should.eql([
            { name: 'cnpmjstest10', email: 'fengmk2@gmail.com' },
            { name: 'cnpmjstest101', email: 'fengmk2@gmail.com' },
          ]);
          done();
        });

        // /pkg/0.0.1
        request(app)
        .get('/mk2testmodule/0.0.1')
        .expect(200, function (err, res) {
          should.not.exist(err);
          var pkg = res.body;
          pkg.maintainers.should.length(2);
          pkg.maintainers.sort(function (a, b) {
            return a.name > b.name ? 1 : -1;
          });
          pkg.maintainers.should.eql([
            { name: 'cnpmjstest10', email: 'fengmk2@gmail.com' },
            { name: 'cnpmjstest101', email: 'fengmk2@gmail.com' },
          ]);
          done();
        });
      });
    });

    it('should add again new maintainers', function (done) {
      request(app)
      .put('/mk2testmodule/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest10',
          email: 'cnpmjstest10@cnpmjs.org'
        }, {
          name: 'fengmk2',
          email: 'fengmk2@cnpmjs.org'
        }]
      })
      .set('authorization', utils.adminAuth)
      .expect(201)
      .expect('content-type', 'application/json; charset=utf-8', done);
    });

    it('should rm maintainers', function (done) {
      request(app)
      .put('/mk2testmodule/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest10',
          email: 'cnpmjstest10@cnpmjs.org'
        }]
      })
      .set('authorization', utils.adminAuth)
      .expect(201)
      .expect('content-type', 'application/json; charset=utf-8', done);
    });

    it('should rm again maintainers', function (done) {
      request(app)
      .put('/mk2testmodule/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest10',
          email: 'cnpmjstest10@cnpmjs.org'
        }]
      })
      .set('authorization', utils.adminAuth)
      .expect(201)
      .expect({
        id: 'mk2testmodule',
        rev: '1',
        ok: true
      }, done);
    });

    it('should rm all maintainers forbidden 403', function (done) {
      request(app)
      .put('/mk2testmodule/-rev/1')
      .send({
        maintainers: []
      })
      .set('authorization', utils.adminAuth)
      .expect(403)
      .expect({error: 'invalid operation', reason: 'Can not remove all maintainers'})
      .expect('content-type', 'application/json; charset=utf-8', done);
    });

    it('should 403 when not maintainer update in private mode', function (done) {
      request(app)
      .put('/mk2testmodule/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest10',
          email: 'cnpmjstest10@cnpmjs.org'
        }]
      })
      .set('authorization', utils.otherUserAuth)
      .expect(403)
      .expect({
        error: 'no_perms',
        reason: 'Private mode enable, only admin can publish this module'
      }, done);
    });

    it('should 403 when not maintainer update in public mode', function (done) {
      mm(config, 'enablePrivate', false);
      mm(config, 'forcePublishWithScope', false);
      request(app)
      .put('/mk2testmodule/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest10',
          email: 'cnpmjstest10@cnpmjs.org'
        }]
      })
      .set('authorization', utils.otherUserAuth)
      .expect(403)
      .expect({
        error: 'forbidden user',
        reason: 'cnpmjstest101 not authorized to modify mk2testmodule'
      }, done);
    });
  });

  describe('PUT /:name old publish flow (stop support)', function () {
    var pkg = {
      name: 'testputmodule',
      description: 'test put module',
      readme: 'readme text',
      maintainers: [{
        name: 'cnpmjstest10',
        email: 'cnpmjstest10@cnpmjs.org'
      }],
      keywords: [
        'testputmodule', 'test', 'cnpmjstest'
      ],
      dependencies: {
        'foo-testputmodule': "*",
        'bar-testputmodule': '*'
      }
    };
    var baseauth = 'Basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64');
    var baseauthOther = 'Basic ' + new Buffer('cnpmjstest101:cnpmjstest101').toString('base64');
    var lastRev;

    before(function (done) {
      // unpublish testputmodule
      request(app)
      .del('/' + pkg.name + '/-rev/1')
      .set('authorization', baseauth)
      .end(function (err, res) {
        done();
      });
    });

    it('should publish return 400', function (done) {
      request(app)
      .put('/' + pkg.name)
      .set('authorization', baseauth)
      .send(pkg)
      .expect(400, function (err, res) {
        should.not.exist(err);
        res.body.reason.should.equal('version undefined not found');
        done();
      });
    });

    it('should publish exists return 400', function (done) {
      request(app)
      .put('/' + pkg.name)
      .set('authorization', baseauth)
      .send(pkg)
      .expect(400, done);
    });

    it('should try to add return 400 when not module user and only next module exists',
    function (done) {
      mm(config, 'enablePrivate', false);
      mm(config, 'forcePublishWithScope', false);
      request(app)
      .put('/' + pkg.name)
      .set('authorization', baseauthOther)
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

    it('should upload 404', function (done) {
      var body = fs.readFileSync(path.join(fixtures, 'testputmodule-0.1.9.tgz'));
      request(app)
      .put('/' + pkg.name + '/-/' + pkg.name + '-0.1.9.tgz/-rev/' + lastRev)
      .set('authorization', baseauth)
      .set('content-type', 'application/octet-stream')
      .set('content-length', '' + body.length)
      .send(body)
      .expect(404, done);
    });

    it('should update 404 package.json info version invalid: /:name/:version/-tag/latest', function (done) {
      var pkg = require(path.join(fixtures, 'testputmodule.json')).versions['0.1.8'];
      pkg.name = 'testputmodule';
      pkg.version = '0.1.9.alpha';
      request(app)
      .put('/' + pkg.name + '/' + pkg.version + '/-tag/latest')
      .set('authorization', baseauth)
      .send(pkg)
      .expect(404, done);
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

  describe('PUT /:name/-rev/:rev removeWithVersions', function () {
    var pkg = require(path.join(fixtures, 'package_and_tgz.json'));
    var pkgname = pkg.name;
    var baseauth = 'Basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64');
    var baseauthOther = 'Basic ' + new Buffer('cnpmjstest101:cnpmjstest101').toString('base64');
    var lastRev;
    before(function (done) {
      request(app)
      .get('/' + pkgname)
      .end(function (err, res) {
        lastRev = res.body._rev;
        done(err);
      });
    });

    it('should update 401 when no auth', function (done) {
      request(app)
      .put('/' + pkgname + '/-rev/123')
      .expect(401, done);
    });

    it('should update 403 when auth error', function (done) {
      request(app)
      .put('/' + pkgname + '/-rev/123')
      .set('authorization', baseauthOther)
      .expect(403, done);
    });

    it('should remove nothing removed ok', function (done) {
      request(app)
      .put('/' + pkgname + '/-rev/' + lastRev)
      .set('authorization', baseauth)
      .send({
        versions: {
          '0.0.1': {},
          '0.0.2': {}
        }
      })
      .expect(201, done);
    });

    it('should remove all version ok', function (done) {
      //do not really remove it here
      mm.empty(Module, 'removeByNameAndVersions');
      mm.empty(Module, 'removeTagsByIds');
      request(app)
      .put('/' + pkgname + '/-rev/' + lastRev)
      .set('authorization', baseauth)
      .send({
        versions: {}
      })
      .expect(201, done);
    });
  });

  describe('GET /:name/download/:filename', function () {
    it('should download a file with 200', function (done) {
      request(app)
      .get('/mk2testmodule/download/mk2testmodule-0.0.1.tgz')
      .expect(200, done);
    });
  });

  describe('DELETE /:name/download/:filename/-rev/:rev', function () {
    var lastRev;
    before(function (done) {
      var pkg = utils.getPackage('test-delete-download-module', '0.1.9');
      request(app)
      .put('/' + pkg.name)
      .set('content-type', 'application/json')
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function (err, res) {
        should.not.exist(err);
        lastRev = res.body.rev;
        done();
      });
    });

    it('should delete 401 when no auth', function (done) {
      request(app)
      .del('/test-delete-download-module/download/test-delete-download-module-0.1.9.tgz/-rev/' + lastRev)
      .expect(401, done);
    });

    it('should delete 403 when auth error', function (done) {
      request(app)
      .del('/test-delete-download-module/download/test-delete-download-module-0.1.9.tgz/-rev/' + lastRev)
      .set('authorization', utils.otherUserAuth)
      .expect(403, done);
    });

    it('should delete file ok', function (done) {
      request(app)
      .del('/test-delete-download-module/download/test-delete-download-module-0.1.9.tgz/-rev/' + lastRev)
      .set('authorization', utils.adminAuth)
      .expect(200, done);
    });
  });

  describe('PUT /:name/:tag updateTag()', function () {
    it('should create new tag ok', function (done) {
      request(app)
      .put('/mk2testmodule/newtag')
      .set('content-type', 'application/json')
      .set('authorization', utils.adminAuth)
      .send('"0.0.1"')
      .expect(201)
      .expect({"ok":true}, done);
    });

    it('should override exist tag ok', function (done) {
      request(app)
      .put('/mk2testmodule/newtag')
      .set('content-type', 'application/json')
      .set('authorization', utils.adminAuth)
      .send('"0.0.1"')
      .expect(201, done);
    });

    it('should tag invalid version 403', function (done) {
      request(app)
      .put('/mk2testmodule/newtag')
      .set('content-type', 'application/json')
      .set('authorization', utils.adminAuth)
      .send('"hello"')
      .expect(403)
      .expect({
        error: 'forbidden',
        reason: 'setting tag newtag to invalid version: hello: mk2testmodule/newtag'
      }, done);
    });

    it('should tag not eixst version 403', function (done) {
      request(app)
      .put('/mk2testmodule/newtag')
      .set('content-type', 'application/json')
      .set('authorization', utils.adminAuth)
      .send('"5.0.0"')
      .expect(403)
      .expect({
        error: 'forbidden',
        reason: 'setting tag newtag to unknown version: 5.0.0: mk2testmodule/newtag'
      }, done);
    });

    describe('update tag not maintainer', function () {
      before(function (done) {
        var pkg = utils.getPackage('update-tag-not-maintainer', '1.0.0');
        request(app)
        .put('/' + pkg.name)
        .set('content-type', 'application/json')
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, done);
      });

      it('should not maintainer update tag return no permission 403', function (done) {
        request(app)
        .put('/update-tag-not-maintainer/newtag')
        .set('content-type', 'application/json')
        .set('authorization', utils.otherUserAuth)
        .send('"1.0.0"')
        .expect(403)
        .expect({
          error: 'forbidden user',
          reason: 'cnpmjstest101 not authorized to modify update-tag-not-maintainer'
        }, done);
      });
    });
  });

  describe('DELETE /:name/-rev/:rev', function () {
    var baseauth = 'Basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64');
    var baseauthOther = 'Basic ' + new Buffer('cnpmjstest101:cnpmjstest101').toString('base64');
    var lastRev;
    before(function (done) {
      request(app)
      .get('/testputmodule')
      .end(function (err, res) {
        lastRev = res.body._rev;
        done(err);
      });
    });

    it('should delete 401 when no auth', function (done) {
      request(app)
      .del('/testputmodule/-rev/' + lastRev)
      .expect(401, done);
    });

    it('should delete 403 when auth error', function (done) {
      request(app)
      .del('/testputmodule/-rev/' + lastRev)
      .set('authorization', utils.otherUserAuth)
      .expect(403, done);
    });

    describe('remove all modules by name', function () {
      before(function (done) {
        var pkg = utils.getPackage('remove-all-module');
        request(app)
        .put('/remove-all-module')
        .set('content-type', 'application/json')
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, done);
      });

      it('should fail when user not maintainer', function (done) {
        request(app)
        .del('/remove-all-module/-rev/1')
        .set('authorization', utils.otherUserAuth)
        .expect(403, function (err, res) {
          should.not.exist(err);
          res.body.should.eql({
            error: 'no_perms',
            reason: 'Private mode enable, only admin can publish this module'
          });
          done();
        });
      });

      it('should remove all versions ok', function (done) {
        request(app)
        .del('/remove-all-module/-rev/1')
        .set('authorization', utils.adminAuth)
        .expect(200, function (err, res) {
          should.not.exist(err);
          should.not.exist(res.headers['set-cookie']);
          mysql.query('SELECT * FROM module_maintainer WHERE name=?', ['remove-all-module'],
          function (err, rows) {
            should.not.exist(err);
            rows.should.length(0);
            done();
          });
        });
      });
    });
  });
});
