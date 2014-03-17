/*!
 * cnpmjs.org - test/sync/sync_exist.js
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
var sync = require('../../sync/sync_exist');
var mm = require('mm');
var Npm = require('../../proxy/npm');
var Total = require('../../proxy/total');
var should = require('should');

describe('sync/sync_exist.js', function () {
  describe('sync()', function () {
    afterEach(mm.restore);

    it('should sync first time ok', function *() {
      mm.data(Npm, 'getShort', ['cnpmjs.org', 'cutter']);
      mm.data(Total, 'getTotalInfo', {last_exist_sync_time: 0});
      var data = yield sync();
      data.successes.should.eql(['cnpmjs.org', 'cutter']);
    });

    it('should sync common ok', function *() {
      mm.data(Npm, 'getAllSince', {
        _updated: Date.now(),
        'cnpmjs.org': {},
        cutter: {}
      });
      mm.data(Total, 'getTotalInfo', {last_exist_sync_time: Date.now()});
      var data = yield sync();
      data.successes.should.eql(['cnpmjs.org', 'cutter']);
    });
  });
});
