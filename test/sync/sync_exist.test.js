'use strict';

const mm = require('mm');
const config = require('../../config');
const sync = require('../../sync/sync_exist');
const npmService = require('../../services/npm');
const totalService = require('../../services/total');
const utils = require('../utils');

describe('test/sync/sync_exist.test.js', () => {
  beforeEach(() => {
    mm(config, 'syncModel', 'all');
  });

  afterEach(mm.restore);

  describe('sync()', () => {
    before(done => {
      utils.sync('byte', done);
    });

    it('should sync first time ok', function* () {
      mm.data(npmService, 'getShort', [ 'byte' ]);
      mm.data(totalService, 'getTotalInfo', { last_exist_sync_time: 0 });
      const data = yield sync();
      data.successes.should.eql([ 'byte' ]);
    });

    it('should sync common ok', function* () {
      mm.data(npmService, 'getAllSince', {
        _updated: Date.now(),
        byte: {},
      });
      mm.data(totalService, 'getTotalInfo', { last_exist_sync_time: Date.now() });
      const data = yield sync();
      data.successes.should.eql([ 'byte' ]);

      mm.data(npmService, 'getAllSince', []);
      const data2 = yield sync();
      data2.successes.should.eql([]);
    });

    it('should sync with array format data', function* () {
      mm.data(npmService, 'getAllSince', [
        {
          name: 'byte',
        },
      ]);
      mm.data(totalService, 'getTotalInfo', { last_exist_sync_time: Date.now() });
      const data = yield sync();
      data.successes.should.eql([ 'byte' ]);

      mm.data(npmService, 'getAllSince', []);
      const data2 = yield sync();
      data2.successes.should.eql([]);
    });
  });
});
