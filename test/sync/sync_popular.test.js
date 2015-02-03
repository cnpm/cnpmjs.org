/**!
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

var mm = require('mm');
var config = require('../../config');
var npmService = require('../../services/npm');
var syncPopular = require('../../sync/sync_popular');

describe('sync/sync_popular.test.js', function () {
  beforeEach(function () {
    mm(config, 'syncModel', 'all');
  });

  afterEach(mm.restore);

  describe('sync()', function () {
    it('should sync popular modules ok', function* () {
      mm.data(npmService, 'getPopular', [['mk2testmodule', 1001]]);
      var data = yield* syncPopular();
      data.successes.should.eql(['mk2testmodule']);
      mm.restore();
    });
  });
});
