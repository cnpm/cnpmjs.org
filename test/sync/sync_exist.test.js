/*!
 * cnpmjs.org - test/sync/sync_exist.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var mm = require('mm');
var sync = require('../../sync/sync_exist');
var Npm = require('../../proxy/npm');
var Total = require('../../proxy/total');

describe('sync/sync_exist.test.js', function () {
  describe('sync()', function () {
    afterEach(mm.restore);

    it('should sync first time ok', function *() {
      mm.data(Npm, 'getShort', ['mk2testmodule']);
      mm.data(Total, 'getTotalInfo', {last_exist_sync_time: 0});
      var data = yield sync();
      data.successes.should.eql(['mk2testmodule']);
    });

    it('should sync common ok', function *() {
      mm.data(Npm, 'getAllSince', {
        _updated: Date.now(),
        'mk2testmodule': {},
      });
      mm.data(Total, 'getTotalInfo', {last_exist_sync_time: Date.now()});
      var data = yield sync();
      data.successes.should.eql(['mk2testmodule']);
    });
  });
});
