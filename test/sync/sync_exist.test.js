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

var mm = require('mm');
var config = require('../../config');
var sync = require('../../sync/sync_exist');
var npmService = require('../../services/npm');
var totalService = require('../../services/total');
var utils = require('../utils');

describe('sync/sync_exist.test.js', function () {
  beforeEach(function () {
    mm(config, 'syncModel', 'all');
  });

  afterEach(mm.restore);

  describe('sync()', function () {
    before(function (done) {
      utils.sync('byte', done);
    });

    it('should sync first time ok', function *() {
      mm.data(npmService, 'getShort', ['byte']);
      mm.data(totalService, 'getTotalInfo', {last_exist_sync_time: 0});
      var data = yield* sync();
      data.successes.should.eql(['byte']);
    });

    it('should sync common ok', function *() {
      mm.data(npmService, 'getAllSince', {
        _updated: Date.now(),
        'byte': {},
      });
      mm.data(totalService, 'getTotalInfo', {last_exist_sync_time: Date.now()});
      var data = yield* sync();
      data.successes.should.eql(['byte']);

      mm.data(npmService, 'getAllSince', {
        _updated: Date.now(),
      });
      var data = yield* sync();
      data.successes.should.eql([]);
    });
  });
});
