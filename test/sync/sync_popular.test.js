'use strict';

var assert = require('assert');
var mm = require('mm');
var config = require('../../config');
var npmService = require('../../services/npm');
var syncPopular = require('../../sync/sync_popular');

describe('sync/sync_popular.test.js', () => {
  beforeEach(() => {
    mm(config, 'syncModel', 'all');
  });

  afterEach(mm.restore);

  describe('sync()', () => {
    it('should sync popular modules ok', function* () {
      mm.data(npmService, 'getPopular', [['mk2testmodule', 1001]]);
      var data = yield syncPopular();
      assert(data.successes.length >= 1 && data.successes.length <= 2);
      // data.successes.should.eql(['mk2testmodule']);
      mm.restore();
    });
  });
});
