/**!
 * cnpmjs.org - test/proxy/module_star.test.js
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
var co = require('co');
var Star = require('../../proxy/module_star');

describe('proxy/module_star.test.js', function () {
  before(function (done) {
    co(function *() {
      yield Star.remove('testmodule', 'fengmk2');
      yield Star.remove('testmodule', 'mk1');
      yield Star.remove('testmodule', 'mk2');
      done();
    })();
  });

  it('should add a star', function (done) {
    co(function *() {
      yield Star.add('testmodule', 'fengmk2');
      // again should be ok
      yield Star.add('testmodule', 'fengmk2');
      yield Star.add('testmodule', 'fengmk2');
      done();
    })();
  });

  it('should get all star users', function (done) {
    co(function *() {
      yield Star.add('testmodule', 'fengmk2');
      yield Star.add('testmodule', 'mk1');
      yield Star.add('testmodule', 'mk2');

      var rows = yield Star.listUsers('testmodule');
      rows.should.containDeep(['fengmk2', 'mk1', 'mk2']);
      done();
    })();
  });

  it('should get user all star modules', function (done) {
    co(function *() {
      yield Star.add('testmodule', 'fengmk2');
      yield Star.add('testmodule1', 'fengmk2');
      yield Star.add('testmodule2', 'fengmk2');

      var rows = yield Star.listUserModules('fengmk2');
      rows.should.containDeep(['testmodule', 'testmodule1', 'testmodule2']);
      done();
    })();
  });
});
