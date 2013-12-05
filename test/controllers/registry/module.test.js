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
var app = require('../../../servers/registry');
var Module = require('../../../proxy/module');

var fixtures = path.join(path.dirname(path.dirname(__dirname)), 'fixtures');

describe('controllers/registry/module.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });
  after(function (done) {
    app.close(done);
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
        res.body.author.should.eql({
          "name": "fengmk2",
          // "email": "fengmk2@gmail.com",
          // "url": "http://fengmk2.github.com"
        });
        res.body.name.should.equal('cnpmjs.org');
        done();
      });
    });
  });

  describe('GET /:name/:version', function () {
    it('should return module@version info', function (done) {
      request(app)
      .get('/cnpmjs.org/0.0.2')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var body = res.body;
        body.name.should.equal('cnpmjs.org');
        body.version.should.equal('0.0.2');
        body._id.should.equal('cnpmjs.org@0.0.2');
        body.dist.should.have.keys('tarball', 'shasum', 'size');
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
      // clean up testputmodule
      Module.removeByName('testputmodule', done);
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

    it('should try to add return 403 when not module user and only next module exists', function (done) {
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
        console.log('lastRev: %s', lastRev);
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

    it('should upload tarball fail 403 when rev not match current module', function (done) {
      var body = fs.readFileSync(path.join(fixtures, 'testputmodule-0.1.9.tgz'));
      request(app)
      .put('/' + pkg.name + '/-/' + pkg.name + '-0.1.9.tgz/-rev/25')
      .set('authorization', baseauth)
      .set('content-type', 'application/octet-stream')
      .set('content-length', '' + body.length)
      .send(body)
      .expect(403, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          error: 'no_perms',
          reason: 'Current user can not publish this module'
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
        res.body.should.eql({
          ok: true,
          rev: Number(lastRev) + 1
        });
        done();
      });
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
        res.body.dist.tarball.should.include('/testputmodule/-/testputmodule-0.1.9.tgz');
        done();
      });
    });

  });
});
