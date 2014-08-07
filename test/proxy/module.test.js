/**!
 * cnpmjs.org - test/proxy/module.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var mm = require('mm');
var fs = require('fs');
var path = require('path');
var request = require('supertest');
var mysql = require('../../common/mysql');
var Module = require('../../proxy/module');
var config = require('../../config');
var utils = require('../utils');
var app = require('../../servers/registry');

var fixtures = path.join(path.dirname(__dirname), 'fixtures');

var id;
var pkgname = 'module-proxy-test-pkg';
var pkgversion = '1.0.0';

describe('proxy/module.test.js', function () {

  before(function (done) {
    var pkg = utils.getPackage(pkgname, pkgversion, utils.admin);
    request(app.listen())
    .put('/' + pkgname)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  afterEach(mm.restore);

  describe('addTag()', function () {
    it('should add tag auto add module id', function (done) {
      Module.addTag('mocha', 'test', '1.15.1', function (err, result) {
        should.not.exist(err);
        result.should.have.keys('id', 'gmt_modified', 'module_id');
        done();
      });
    });
  });

  describe('search()', function () {
    before(function (done) {
      Module.addKeywords('aaaa', 'mock aaaaaa', ['aa', 'bb', 'cc'], function (err, results) {
        should.not.exist(err);
        results.should.be.an.Array;
        results.should.length(3);
        done();
      });
    });

    it.skip('should search modules', function (done) {
      Module.search('mock', function (err, data) {
        should.not.exist(err);
        data.should.have.keys('keywordMatchs', 'searchMatchs');
        data.searchMatchs.length.should.above(0);
        data.searchMatchs.forEach(function (row) {
          row.should.have.keys('name', 'description');
        });
        done();
      });
    });

    it('should search match keywords modules', function (done) {
      Module.search('aa', function (err, data) {
        should.not.exist(err);
        data.should.have.keys('keywordMatchs', 'searchMatchs');
        data.keywordMatchs.length.should.above(0);
        data.keywordMatchs.forEach(function (row) {
          row.should.have.keys('name', 'description');
        });
        done();
      });
    });

    it('should search return empty', function (done) {
      Module.search('emptyemptyemptyempty', function (err, data) {
        should.not.exist(err);
        data.should.eql({
          keywordMatchs: [],
          searchMatchs: []
        });
        done();
      });
    });
  });

  var mockName = 'aa' + Date.now();
  describe('addKeywords()', function () {
    it('should add diff keywords to module', function (done) {
      Module.addKeywords(mockName, mockName, ['aa', 'bb', 'cc'], function (err, results) {
        should.not.exist(err);
        results.should.be.an.Array;
        results.should.length(3);
        done();
      });
    });

    it('should add same keywords to module', function (done) {
      Module.addKeywords(mockName, 'desc aa', ['aa', 'bb', 'cc'], function (err, results) {
        should.not.exist(err);
        results.should.be.an.Array;
        results.should.length(3);
        // results.should.length(0);
        done();
      });
    });
  });

  describe('getKeywords()', function () {
    it('should get aa module keywords', function (done) {
      Module.getKeywords(mockName, function (err, keywords) {
        should.not.exist(err);
        keywords.should.eql(['aa', 'bb', 'cc']);
        done();
      });
    });
  });

  describe('add()', function () {
    it('should success ad he@0.3.6', function (done) {
      var sourcePackage = require('../fixtures/0.3.6.json');
      var mod = {
        version: sourcePackage.version,
        name: sourcePackage.name,
        package: sourcePackage,
        author: 'unittest',
        publish_time: sourcePackage.publish_time || Date.now(),
      };
      var dist = {
        tarball: 'http://registry.npmjs.org/he/-/he-0.3.6.tgz',
        shasum: '9d7bc446e77963933301dd602d5731cb861135e0',
        size: 100,
      };
      mod.package.dist = dist;
      Module.add(mod, function (err, result) {
        id = result.id;
        should.not.exist(err);
        Module.getById(result.id, function (err, row) {
          should.not.exist(err);
          row.package.readme.should.equal(sourcePackage.readme);
          done();
        });
      });
    });
  });

  describe('listByAuthor()', function () {
    it('should return author recent modules', function* () {
      var rows = yield Module.listByAuthor('fengmk2');
      rows.forEach(function (r) {
        r.should.have.keys('name', 'description');
      });
    });
  });

  describe('updateReadme()', function () {
    it('should update ok', function* () {
      var row = yield Module.get(pkgname, pkgversion);
      should.exist(row);
      yield* Module.updateReadme(row.id, 'test');
      var data = yield Module.getById(row.id);
      data.package.readme.should.equal('test');
    });
  });

  describe('removeTagsByNames()', function () {
    it('should work', function* () {
      yield* Module.removeTagsByNames('foo', ['latest', '1.0']);
    });
  });

  describe('listPrivates()', function () {
    it('should response [] if scopes not present', function* () {
      mm(config, 'scopes', []);
      var modules = yield Module.listPrivates();
      modules.should.eql([]);
    });

    it('should response [] if private modules not present', function* () {
      mm(config, 'privatePackages', []);
      mm(config, 'scopes', ['@not-exist']);
      var modules = yield Module.listPrivates();
      modules.should.eql([]);
    });

    it('should work', function* () {
      var modules = yield Module.listPrivates();
      modules.forEach(function (m) {
        m.should.have.keys(['name', 'description']);
      })
    });
  });
});
