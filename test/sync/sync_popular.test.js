/*!
 * cnpmjs.org - test/sync/sync_popular.test.js
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
var sync = require('../../sync/sync_popular');
var mm = require('mm');
var Npm = require('../../proxy/npm');
var Total = require('../../proxy/total');
var should = require('should');

describe('sync/sync_popular.test.js', function () {
  describe('sync()', function () {
    afterEach(mm.restore);
    it('should sync popular modules ok', function *() {
      mm.data(Npm, 'getPopular', ['mk2testmodule']);
      var data = yield sync;
      data.successes.should.eql(['mk2testmodule']);
      mm.restore();
    });
  });
});
