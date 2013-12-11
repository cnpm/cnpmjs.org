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
var mysql = require('../../common/mysql');
var Module = require('../../proxy/module');

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
