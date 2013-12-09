/**!
 * cnpmjs.org - test/proxy/module_log.test.js
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
var mysql = require('../../common/mysql');
var Log = require('../../proxy/module_log');
var mm = require('mm');

describe('proxy/module_log.test.js', function () {
  afterEach(mm.restore);

  describe('create(), append()', function () {
    var lastId;
    it('should create a log row', function (done) {
      Log.create({name: 'utility', username: 'fengmk2'}, function (err, result) {
        should.not.exist(err);
        result.should.have.keys('id', 'gmt_modified');
        lastId = result.id;
        done();
      });
    });

    it('should append a log', function (done) {
      Log.append(lastId, 'a new line', function (err, result) {
        should.not.exist(err);
        result.should.have.keys('id', 'gmt_modified');
        Log.get(lastId, function (err, row) {
          should.not.exist(err);
          row.log.should.equal('\na new line');
          Log.append(lastId, 'second line', function (err, result) {
            should.not.exist(err);
            result.should.have.keys('id', 'gmt_modified');
            Log.get(lastId, function (err, row) {
              should.not.exist(err);
              row.log.should.equal('\na new line\nsecond line');
              done();
            });
          });
        });
      });
    });
  });
});



