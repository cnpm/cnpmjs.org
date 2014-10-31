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
var sync = require('../../sync/sync_exist');
var npmService = require('../../services/npm');
var totalService = require('../../services/total');
var SyncModuleWorker = require('../../controllers/sync_module_worker');

describe('sync/sync_exist.test.js', function () {
  describe('sync()', function () {
    afterEach(mm.restore);

    before(function (done) {
      var worker = new SyncModuleWorker({
        name: 'pedding',
        username: 'admin',
        noDep: true
      });
      worker.start();
      worker.on('end', done);
    });

    it('should sync first time ok', function *() {
      mm.data(npmService, 'getShort', ['pedding']);
      mm.data(totalService, 'getTotalInfo', {last_exist_sync_time: 0});
      var data = yield* sync();
      data.successes.should.eql(['pedding']);
    });

    it('should sync common ok', function *() {
      mm.data(npmService, 'getAllSince', {
        _updated: Date.now(),
        'pedding': {},
      });
      mm.data(totalService, 'getTotalInfo', {last_exist_sync_time: Date.now()});
      var data = yield* sync();
      data.successes.should.eql(['pedding']);

      mm.data(npmService, 'getAllSince', {
        _updated: Date.now(),
      });
      var data = yield* sync();
      data.successes.should.eql([]);
    });
  });
});
