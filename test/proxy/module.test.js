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
var mysql = require('../../common/mysql');
var Module = require('../../proxy/module');

var fixtures = path.join(path.dirname(__dirname), 'fixtures');

describe('proxy/module.test.js', function () {
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
    it('should return author recent modules', function (done) {
      Module.listByAuthor('fengmk2', function (err, rows) {
        should.not.exist(err);
        rows.forEach(function (r) {
          r.should.have.keys('name', 'description');
        });
        done();
      });
    });
  });
});
