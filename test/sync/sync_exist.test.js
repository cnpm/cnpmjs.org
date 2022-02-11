'use strict';

var mm = require('mm');
var config = require('../../config');
var sync = require('../../sync/sync_exist');
var npmService = require('../../services/npm');
var totalService = require('../../services/total');
var utils = require('../utils');

describe('test/sync/sync_exist.test.js', function () {
  beforeEach(function () {
    mm(config, 'syncModel', 'all');
  });

  afterEach(mm.restore);

  describe('sync()', function () {
    before(function (done) {
      utils.sync('byte', done);
    });

    it('should sync first time ok', function *() {
      mm.data(npmService, 'listChanges', [
        {
          seq: 1,
          id: 'byte',
        }
      ]);
      mm.data(totalService, 'getTotalInfo', {last_exist_sync_time: 0});
      var data = yield sync();
      data.successes[0].should.equal('byte');
    });

    it('should sync common ok', function *() {
      mm.data(npmService, 'listChanges', [
        {
          seq: 2,
          id: 'byte',
        }
      ]);
      mm.data(totalService, 'getTotalInfo', {last_exist_sync_time: Date.now()});
      var data = yield sync();
      data.successes[0].should.equal('byte');

      mm.data(npmService, 'listChanges', []);
      var data = yield sync();
      data.successes.should.eql([]);
    });

    it('should sync with array format data', function *() {
      mm.data(npmService, 'listChanges', [
        {
          seq: 3,
          id: 'byte',
        }
      ]);
      mm.data(totalService, 'getTotalInfo', {last_exist_sync_time: Date.now()});
      var data = yield sync();
      data.successes[0].should.equal('byte');

      mm.data(npmService, 'listChanges', []);
      var data = yield sync();
      data.successes.should.eql([]);
    });
  });
});
