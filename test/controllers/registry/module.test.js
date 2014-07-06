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
var config = require('../../../config');
var app = require('../../../servers/registry');
var Module = require('../../../proxy/module');
var Npm = require('../../../proxy/npm');
var controller = require('../../../controllers/registry/module');
var ModuleDeps = require('../../../proxy/module_deps');
var SyncModuleWorker = require('../../../proxy/sync_module_worker');

var fixtures = path.join(path.dirname(path.dirname(__dirname)), 'fixtures');

describe('controllers/registry/module.test.js', function () {
  var baseauth = 'Basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64');
  var baseauthOther = 'Basic ' + new Buffer('cnpmjstest101:cnpmjstest101').toString('base64');

  before(function (done) {
    app.listen(0, function () {
      var pkg = require(path.join(fixtures, 'package_and_tgz.json'));
      pkg.maintainers[0].name = 'cnpmjstest10';
      pkg.versions['0.0.1'].maintainers[0].name = 'cnpmjstest10';
      request(app)
      .put('/' + pkg.name)
      .set('authorization', baseauth)
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
      .set('authorization', baseauth)
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
        body.version.should.equal('0.0.1');
        body._id.should.equal('mk2testmodule@0.0.1');
        body.dist.tarball.should.containEql('/mk2testmodule/download/mk2testmodule-0.0.1.tgz');
        done();
      });
    });
  });

  describe('PUT /:name/-rev/id update maintainers', function () {
    before(function (done) {
      request(app)
      .put('/mk2testmodule/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest10',
          email: 'cnpmjstest10@cnpmjs.org'
        }]
      })
      .set('authorization', baseauth)
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
          name: 'fengmk2',
          email: 'fengmk2@cnpmjs.org'
        }]
      })
      .set('authorization', baseauth)
      .expect(201)
      .expect('content-type', 'application/json; charset=utf-8', done);
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
      .set('authorization', baseauth)
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
      .set('authorization', baseauth)
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
      .set('authorization', baseauth)
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
      .set('authorization', baseauth)
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
      .set('authorization', baseauthOther)
      .expect(403)
      .expect({
        error: 'no_perms',
        reason: 'Private mode enable, only admin can publish this module'
      }, done);
    });

    it('should 403 when not maintainer update in public mode', function (done) {
      mm(config, 'enablePrivate', false);
      request(app)
      .put('/mk2testmodule/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest10',
          email: 'cnpmjstest10@cnpmjs.org'
        }]
      })
      .set('authorization', baseauthOther)
      .expect(403)
      .expect({
        error: 'forbidden user',
        reason: 'cnpmjstest101 not authorized to modify mk2testmodule'
      }, done);
    });
  });

  describe('PUT /:name old publish flow', function () {
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

    it('should try to add not exists module return 201', function (done) {
      request(app)
      .put('/' + pkg.name)
      .set('authorization', baseauth)
      .send(pkg)
      .expect(201, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'id', 'rev');
        res.body.ok.should.equal(true);
        res.body.id.should.equal(pkg.name);
        res.body.rev.should.be.a.String;
        done();
      });
    });

    it('should try to add return 409 when only next module exists', function (done) {
      request(app)
      .put('/' + pkg.name)
      .set('authorization', baseauth)
      .send(pkg)
      .expect(201, done);
    });

    it.skip('should try to add return 403 when not module user and only next module exists',
    function (done) {
      mm(config, 'enablePrivate', false);
      request(app)
      .put('/' + pkg.name)
      .set('authorization', baseauthOther)
      .send(pkg)
      .expect(403, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          error: 'no_perms',
          reason: 'Current user can not publish this module'
        });
        done();
      });
    });

    it('should get versions empty when only next module exists', function (done) {
      request(app)
      .get('/' + pkg.name)
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('_id', '_rev', 'name', 'description', 'versions', 'dist-tags',
          'readme', 'maintainers', 'time', '_attachments', 'users');
        res.body.versions.should.eql({});
        res.body.time.should.eql({});
        res.body['dist-tags'].should.eql({});
        lastRev = res.body._rev;
        // console.log('lastRev: %s', lastRev);
        done();
      });
    });

    it('should upload tarball success: /:name/-/:filename/-rev/:rev', function (done) {
      var body = fs.readFileSync(path.join(fixtures, 'testputmodule-0.1.9.tgz'));
      request(app)
      .put('/' + pkg.name + '/-/' + pkg.name + '-0.1.9.tgz/-rev/' + lastRev)
      .set('authorization', baseauth)
      .set('content-type', 'application/octet-stream')
      .set('content-length', '' + body.length)
      .send(body)
      .expect(201, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          ok: true,
          rev: lastRev,
        });
        done();
      });
    });

    it('should upload tarball success again: /:name/-/:filename/-rev/:rev', function (done) {
      var body = fs.readFileSync(path.join(fixtures, 'testputmodule-0.1.9.tgz'));
      request(app)
      .put('/' + pkg.name + '/-/' + pkg.name + '-0.1.9.tgz/-rev/' + lastRev)
      .set('authorization', baseauth)
      .set('content-type', 'application/octet-stream')
      .set('content-length', '' + body.length)
      .send(body)
      .expect(201, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          ok: true,
          rev: lastRev,
        });
        done();
      });
    });

    it('should upload tarball fail 403 when user not admin', function (done) {
      var body = fs.readFileSync(path.join(fixtures, 'testputmodule-0.1.9.tgz'));
      request(app)
      .put('/' + pkg.name + '/-/' + pkg.name + '-0.1.9.tgz/-rev/25')
      .set('authorization', baseauthOther)
      .set('content-type', 'application/octet-stream')
      .set('content-length', '' + body.length)
      .send(body)
      .expect(403, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          error: 'no_perms',
          reason: 'Private mode enable, only admin can publish this module'
        });
        done();
      });
    });

    it('should upload tarball fail 404 when rev wrong', function (done) {
      var body = fs.readFileSync(path.join(fixtures, 'testputmodule-0.1.9.tgz'));
      request(app)
      .put('/' + pkg.name + '/-/' + pkg.name + '-0.1.9.tgz/-rev/' + '1231231')
      .set('authorization', baseauth)
      .set('content-type', 'application/octet-stream')
      .set('content-length', '' + body.length)
      .send(body)
      .expect(404, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          error: 'not_found',
          reason: 'document not found'
        });
        done();
      });
    });

    it('should update package.json info success: /:name/:version/-tag/latest', function (done) {
      var pkg = require(path.join(fixtures, 'testputmodule.json')).versions['0.1.8'];
      pkg.name = 'testputmodule';
      pkg.version = '0.1.9';
      pkg.dependencies['foo-testputmodule'] = '*';
      request(app)
      .put('/' + pkg.name + '/' + pkg.version + '/-tag/latest')
      .set('authorization', baseauth)
      .send(pkg)
      .expect(201, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'rev');
        // should get deps foo-testputmodule contains 'testputmodule'
        ModuleDeps.list('foo-testputmodule', function (err, rows) {
          should.not.exist(err);
          var exists = rows.filter(function (r) {
            return r.deps === 'testputmodule';
          });
          exists.should.length(1);
          exists[0].deps.should.equal('testputmodule');
          done();
        });
      });
    });

    it('should update package.json info version invalid: /:name/:version/-tag/latest', function (done) {
      var pkg = require(path.join(fixtures, 'testputmodule.json')).versions['0.1.8'];
      pkg.name = 'testputmodule';
      pkg.version = '0.1.9.alpha';
      request(app)
      .put('/' + pkg.name + '/' + pkg.version + '/-tag/latest')
      .set('authorization', baseauth)
      .send(pkg)
      .expect(400)
      .expect({
        error: 'Params Invalid',
        reason: 'Invalid version: ' + pkg.version
      }, done);
    });

    it('should update package.json info again fail 403: /:name/:version/-tag/latest', function (done) {
      var pkg = require(path.join(fixtures, 'testputmodule.json')).versions['0.1.8'];
      pkg.name = 'testputmodule';
      pkg.version = '0.1.10';
      request(app)
      .put('/' + pkg.name + '/' + pkg.version + '/-tag/latest')
      .set('authorization', baseauth)
      .send(pkg)
      .expect(403, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          error: 'version_wrong',
          reason: 'version not match'
        });
        done();
      });
    });

    it('should get new package info', function (done) {
      request(app)
      .get('/testputmodule/0.1.9')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.name.should.equal('testputmodule');
        res.body.version.should.equal('0.1.9');
        res.body.dist.tarball.should.containEql('/testputmodule/download/testputmodule-0.1.9.tgz');
        done();
      });
    });

    it('should publish with tgz base64, addPackageAndDist()', function (done) {
      var pkg = require(path.join(fixtures, 'package_and_tgz.json'));
      // delete first
      request(app)
      .del('/' + pkg.name + '/-rev/1')
      .set('authorization', baseauth)
      .expect({ok: true})
      .expect(200, function (err, res) {
        should.not.exist(err);

        request(app)
        .put('/' + pkg.name)
        .set('authorization', baseauth)
        .send(pkg)
        .expect(201, function (err, res) {
          should.not.exist(err);
          res.body.should.have.keys('ok', 'rev');
          res.body.ok.should.equal(true);

          // upload again should 403
          request(app)
          .put('/' + pkg.name)
          .set('authorization', baseauth)
          .send(pkg)
          .expect(403, function (err, res) {
            should.not.exist(err);
            res.body.should.eql({
              error: 'forbidden',
              reason: 'cannot modify pre-existing version: 0.0.1'
            });
            done();
          });

        });
      });
    });

    it('should version_error when versions missing', function (done) {
      var pkg = require(path.join(fixtures, 'package_and_tgz.json'));
      delete pkg.versions;
      request(app)
      .put('/' + pkg.name)
      .set('authorization', baseauth)
      .send(pkg)
      .expect(400, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          error: 'version_error',
          reason: 'filename or version not found, filename: mk2testmodule-0.0.1.tgz, version: undefined'
        });
        done();
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

    it('should update 401 when no auth', function (done) {
      request(app)
      .put('/testputmodule/-rev/123')
      .expect(401, done);
    });

    it('should update 403 when auth error', function (done) {
      request(app)
      .put('/testputmodule/-rev/123')
      .set('authorization', baseauthOther)
      .expect(403, done);
    });

    it('should remove nothing removed ok', function (done) {
      request(app)
      .put('/testputmodule/-rev/' + lastRev)
      .set('authorization', baseauth)
      .send({
        versions: {
          '0.1.9': {}
        }
      })
      .expect(201, done);
    });

    it('should remove all version ok', function (done) {
      //do not really remove it here
      mm.empty(Module, 'removeByNameAndVersions');
      mm.empty(Module, 'removeTagsByIds');
      request(app)
      .put('/testputmodule/-rev/' + lastRev)
      .set('authorization', baseauth)
      .send({
        versions: {}
      })
      .expect(201, done);
    });
  });

  describe('GET /:name/download/:filename', function () {
    it('should download a file with 302 redirect', function (done) {
      request(app)
      .get('/cutter/download/cutter-0.0.2.tgz')
      .expect('Location', config.qn.domain + '/cutter/-/cutter-0.0.2.tgz')
      .expect(302, done);
    });
  });

  describe('DELETE /:name/download/:filename/-rev/:rev', function () {
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
      .del('/testputmodule/download/testputmodule-0.1.9.tgz/-rev/' + lastRev)
      .expect(401, done);
    });

    it('should delete 403 when auth error', function (done) {
      request(app)
      .del('/testputmodule/download/testputmodule-0.1.9.tgz/-rev/' + lastRev)
      .set('authorization', baseauthOther)
      .expect(403, done);
    });

    it('should delete file ok', function (done) {
      request(app)
      .del('/testputmodule/download/testputmodule-0.1.9.tgz/-rev/' + lastRev)
      .set('authorization', baseauth)
      .expect(200, done);
    });
  });

  describe('PUT /:name/:tag updateTag()', function () {
    it('should create new tag ok', function (done) {
      request(app)
      .put('/mk2testmodule/newtag')
      .set('content-type', 'application/json')
      .set('authorization', baseauth)
      .send('"0.0.1"')
      .expect(201)
      .expect({"ok":true}, done);
    });

    it('should override exist tag ok', function (done) {
      request(app)
      .put('/mk2testmodule/newtag')
      .set('content-type', 'application/json')
      .set('authorization', baseauth)
      .send('"0.0.1"')
      .expect(201, done);
    });

    it('should tag invalid version 403', function (done) {
      request(app)
      .put('/mk2testmodule/newtag')
      .set('content-type', 'application/json')
      .set('authorization', baseauth)
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
      .set('authorization', baseauth)
      .send('"5.0.0"')
      .expect(403)
      .expect({
        error: 'forbidden',
        reason: 'setting tag newtag to unknown version: 5.0.0: mk2testmodule/newtag'
      }, done);
    });

    it('should not maintainer tag return no permission 403', function (done) {
      request(app)
      .put('/mk2testmodule/newtag')
      .set('content-type', 'application/json')
      .set('authorization', baseauthOther)
      .send('"0.0.1"')
      .expect(403)
      .expect({
        error: 'forbidden user',
        reason: 'cnpmjstest101 not authorized to modify mk2testmodule'
      }, done);
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
      .set('authorization', baseauthOther)
      .expect(403, done);
    });

    it('shold remove all the module ok', function (done) {
      //do not really remove
      mm.empty(Module, 'removeByName');
      request(app)
      .del('/testputmodule/-rev/' + lastRev)
      .set('authorization', baseauth)
      .expect(200, function (err, res) {
        should.not.exist(err);
        should.not.exist(res.headers['set-cookie']);
        done();
      });
    });
  });
});
