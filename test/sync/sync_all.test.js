'use strict';

var assert = require('assert');
var mm = require('mm');
var config = require('../../config');
var sync = require('../../sync/sync_all');
var npmSerivce = require('../../services/npm');
var totalService = require('../../services/total');
var packageService = require('../../services/package');

describe('test/sync/sync_all.test.js', () => {
  beforeEach(() => {
    mm(config, 'syncModel', 'all');
  });

  afterEach(mm.restore);

  describe('sync()', () => {
    it('should sync first time ok', function* () {
      mm.data(npmSerivce, 'getShort', ['mk2testmodule', 'mk2testmodule-not-exists']);
      mm.data(totalService, 'getTotalInfo', {last_sync_time: 0});
      yield sync;
    });

    it('should sync common ok', function* () {
      mm.data(npmSerivce, 'getAllSince', {
        _updated: Date.now(),
        'mk2testmodule': {},
        // cutter: {}
      });
      mm.data(npmSerivce, 'getShort', ['mk2testmodule']);
      mm.data(totalService, 'getTotalInfo', {last_sync_time: Date.now()});
      mm.data(packageService, 'listAllPublicModuleNames', [ 'mk2testmodule' ]);
      var data = yield sync;
      assert(data.successes.length >= 1 && data.successes.length <= 2);
      // data.successes.should.eql(['mk2testmodule']);
      mm.restore();
    });

    it('should sync with array data format ok', function* () {
      mm.data(npmSerivce, 'getAllSince', [
        {
          name: 'mk2testmodule',
          versions: {
            '0.0.2': 'latest'
          }
        },
        {
          name: 'mk2testmodule1',
          time: {
            modified: '2015-09-05T07:31:35.734Z',
          },
          versions: {
            '0.0.2': 'latest'
          }
        },
      ]);
      mm.data(npmSerivce, 'getShort', ['mk2testmodule']);
      mm.data(totalService, 'getTotalInfo', {last_sync_time: Date.now()});
      mm.data(packageService, 'listAllPublicModuleNames', [ 'mk2testmodule' ]);
      var data = yield sync;
      assert(data.successes.length >= 1 && data.successes.length <= 2);
      // data.successes.should.eql(['mk2testmodule']);
      mm.restore();
    });
  });
});
