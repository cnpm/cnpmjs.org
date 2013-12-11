/*!
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
var config = require('../../../config');
var app = require('../../../servers/registry');
var Module = require('../../../proxy/module');
var Npm = require('../../../proxy/npm');
var controller = require('../../../controllers/registry/module');

var fixtures = path.join(path.dirname(path.dirname(__dirname)), 'fixtures');

describe('controllers/registry/module.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });

  afterEach(mm.restore);

  var baseauth = 'Basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64');
  var baseauthOther = 'Basic ' + new Buffer('cnpmjstest101:cnpmjstest101').toString('base64');

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

  describe('GET /:name', function () {
    it('should return module info', function (done) {
      request(app)
      .get('/cnpmjs.org')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('_id', '_rev', 'name', 'description',
          'versions', 'dist-tags', 'readme', 'maintainers',
          'time', 'author', 'repository', '_attachments');
        // res.body.author.should.eql({
        //   "name": "fengmk2",
        //   "email": "fengmk2@gmail.com",
        //   "url": "http://fengmk2.github.com"
        // });
        res.body.name.should.equal('cnpmjs.org');
        res.body.versions[Object.keys(res.body.versions)[0]].dist.tarball.should.include('/cnpmjs.org/download');
        done();
      });
    });
  });

  describe('GET /:name/:(version|tag)', function () {
    it('should return module@version info', function (done) {
      request(app)
      .get('/cnpmjs.org/0.0.0')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var body = res.body;
        body.name.should.equal('cnpmjs.org');
        body.version.should.equal('0.0.0');
        body._id.should.equal('cnpmjs.org@0.0.0');
        body.dist.tarball.should.include('cnpmjs.org-0.0.0.tgz');
        done();
      });
    });

    it('should return module@tag info', function (done) {
      request(app)
      .get('/cutter/latest')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var body = res.body;
        body.name.should.equal('cutter');
        body.version.should.equal('0.0.3');
        body._id.should.equal('cutter@0.0.3');
        body.dist.tarball.should.include('/cutter/download/cutter-0.0.3.tgz');
        done();
      });
    });
  });

  describe('PUT /:name', function () {
    var pkg = {
      name: 'testputmodule',
      description: 'test put module',
      readme: 'readme text',
      maintainers: [{
        name: 'cnpmjstest10',
        email: 'cnpmjstest10@cnpmjs.org'
      }],
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
      .expect(409, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          error: 'conflict',
          reason: 'Document update conflict.'
        });
        done();
      });
    });

    it('should try to add return 403 when not module user and only next module exists',
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
          'readme', 'maintainers', 'time', '_attachments');
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
      .put('/' + pkg.name + '/-/' + pkg.name + '-0.1.9.tgz/-rev/' + lastRev + '1')
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
      request(app)
      .put('/' + pkg.name + '/' + pkg.version + '/-tag/latest')
      .set('authorization', baseauth)
      .send(pkg)
      .expect(201, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'rev');
        done();
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
        res.body.dist.tarball.should.include('/testputmodule/download/testputmodule-0.1.9.tgz');
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
        res.body.should.be.an.Object;
        res.body._updated.should.be.a.Number;
        var keys = Object.keys(res.body);
        keys.length.should.be.above(1);
        res.body[keys[1]].dist.tarball.should.include('/download/');
        done();
      });
    });

    it('should get 200 but response empty', function (done) {
      request(app)
      .get('/-/all/since?stale=update_after&startkey=' + (Date.now() * 2))
      .expect(200, function (err, res) {
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

  describe('PUT /:name/-rev/:rev', function () {
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

    it('should remove version ok', function (done) {
      //do not really remove it here
      mm.empty(Module, 'removeByNameAndVersions');
      request(app)
      .put('/testputmodule/-rev/' + lastRev)
      .set('authorization', baseauth)
      .send({
        versions: {
        }
      })
      .expect(201, done);
    });
  });

  describe('DELETE /:name/-/:filename/-rev/:rev', function () {
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
      .del('/testputmodule/-/testputmodule-0.1.9.tgz/-rev/' + lastRev)
      .expect(401, done);
    });

    it('should delete 403 when auth error', function (done) {
      request(app)
      .del('/testputmodule/-/testputmodule-0.1.9.tgz/-rev/' + lastRev)
      .set('authorization', baseauthOther)
      .expect(403, done);
    });

    it('should delete file ok', function (done) {
      request(app)
      .del('/testputmodule/-/testputmodule-0.1.9.tgz/-rev/' + lastRev)
      .set('authorization', baseauth)
      .expect(200, done);
    });
  });

  describe('DELETE /:name/-rev/:rev', function (done) {
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
      .expect(200, done);
    });
  });
});
