/*!
 * cnpmjs.org - test/sync/sync_all.test.js
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
var sync = require('../../sync/sync_all');
var Npm = require('../../services/npm');
var Total = require('../../services/total');

describe('sync/sync_all.test.js', function () {
  describe('sync()', function () {
    afterEach(mm.restore);

    it('should sync first time ok', function *() {
      mm.data(Npm, 'getShort', ['mk2testmodule', 'mk2testmodule-not-exists']);
      mm.data(Total, 'getTotalInfo', {last_sync_time: 0});
      var data = yield sync;
      data.successes.should.eql(['mk2testmodule', 'mk2testmodule-not-exists']);
      mm.restore();
      var result = yield Total.getTotalInfo();
      should.exist(result);
      result.last_sync_module.should.equal('mk2testmodule-not-exists');
    });

    it('should sync common ok', function *() {
      mm.data(Npm, 'getAllSince', {
        _updated: Date.now(),
        'mk2testmodule': {},
        // cutter: {}
      });
      mm.data(Npm, 'getShort', ['mk2testmodule']);
      mm.data(Total, 'getTotalInfo', {last_sync_time: Date.now()});
      mm.data(Module, 'listAllModuleNames', [{name: 'mk2testmodule'}]);
      var data = yield sync;
      data.successes.should.eql(['mk2testmodule']);
      mm.restore();
    });
  });
});
