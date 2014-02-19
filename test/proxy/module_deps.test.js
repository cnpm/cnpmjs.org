/**!
 * cnpmjs.org - test/proxy/module_deps.test.js
 *
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var should = require('should');
var pedding = require('pedding');
var ModuleDeps = require('../../proxy/module_deps');

describe('proxy/module_deps.test.js', function () {
  before(function (done) {
    done = pedding(2, done);
    ModuleDeps.remove('testmodule', 'foo', done);
    ModuleDeps.remove('testmodule', 'bar', done);
  });

  describe('add()', function () {
    it('should add foo, bar success', function (done) {
      done = pedding(2, done);
      ModuleDeps.add('testmodule', 'foo', function (err) {
        should.not.exist(err);
        // add again should work
        ModuleDeps.add('testmodule', 'foo', function (err) {
          should.not.exist(err);
          done();
        });
      });

      ModuleDeps.add('testmodule', 'bar', done);
    });
  });

  describe('list()', function () {
    it('should list testmodule deps', function (done) {
      ModuleDeps.list('testmodule', function (err, rows) {
        should.not.exist(err);
        should.exist(rows);
        rows.should.be.an.Array;
        rows.should.length(2);
        rows.forEach(function (row) {
          row.should.have.property('deps');
        });
        done();
      });
    });
  });
});
