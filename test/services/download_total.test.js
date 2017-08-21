/**!
 * cnpmjs.org - test/services/download_total.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var DownloadTotal = require('../../services/download_total');

describe('test/services/download_total.test.js', function () {
  describe('plusModuleTotal()', function () {
    it('should plus one module download count', function* () {
      var data = {
        date: '2014-10-21',
        name: 'plusModuleTotal-module',
        count: 1000
      };
      yield DownloadTotal.plusModuleTotal(data);

      data = {
        date: '2014-10-22',
        name: 'plusModuleTotal-module',
        count: 2
      };
      yield DownloadTotal.plusModuleTotal(data);

      var rows = yield DownloadTotal.getModuleTotal(
        'plusModuleTotal-module', '2014-10-21', '2014-10-21');
      rows.should.length(1);
      rows[0].count.should.equal(1000);
      rows[0].date.should.equal('2014-10-21');

      rows = yield DownloadTotal.getModuleTotal(
        'plusModuleTotal-module', '2014-10-21', '2014-10-22');
      rows.should.length(2);
      rows[0].count.should.equal(1000);
      rows[0].date.should.equal('2014-10-21');
      rows[1].count.should.equal(2);
      rows[1].date.should.equal('2014-10-22');

      // save again
      data = {
        date: '2014-10-21',
        name: 'plusModuleTotal-module',
        count: 3
      };
      yield DownloadTotal.plusModuleTotal(data);
      rows = yield DownloadTotal.getModuleTotal(
        'plusModuleTotal-module', '2014-10-21', '2014-10-21');
      rows.should.length(1);
      rows[0].count.should.equal(1003);
      rows[0].date.should.equal('2014-10-21');

      data = {
        date: '2014-10-22',
        name: 'plusModuleTotal-module2',
        count: 3
      };
      yield DownloadTotal.plusModuleTotal(data);
      data = {
        date: '2014-12-22',
        name: 'plusModuleTotal-module2',
        count: 3
      };
      yield DownloadTotal.plusModuleTotal(data);
      data = {
        date: '2014-12-21',
        name: 'plusModuleTotal-module2',
        count: 3
      };
      yield DownloadTotal.plusModuleTotal(data);

      rows = yield DownloadTotal.getTotal('2014-10-21', '2014-12-21');
      rows.should.length(3);
      rows[0].date.should.equal('2014-10-21');
      rows[0].count.should.equal(1003);
      rows[1].date.should.equal('2014-10-22');
      rows[1].count.should.equal(5);
      rows[2].date.should.equal('2014-12-21');
      rows[2].count.should.equal(3);
    });
  });

  describe('getTotalByName()', function () {
    it('should get total downloads', function* () {
      var data = {
        date: '2014-10-21',
        name: 'getTotalByName-module',
        count: 1000
      };
      yield DownloadTotal.plusModuleTotal(data);

      data = {
        date: '2015-10-22',
        name: 'getTotalByName-module',
        count: 2
      };
      yield DownloadTotal.plusModuleTotal(data);

      var count = yield DownloadTotal.getTotalByName('getTotalByName-module');
      count.should.equal(1002);
    });
  });
});
