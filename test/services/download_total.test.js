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

describe('services/download_total.test.js', function () {
  describe('plusModuleTotal()', function () {
    it('should plus one module download count', function* () {
      var data = {
        date: '2014-10-21',
        name: 'plusModuleTotal-module',
        count: 1000
      };
      yield* DownloadTotal.plusModuleTotal(data);

      var rows = yield* DownloadTotal.getModuleTotal(
        'plusModuleTotal-module', '2014-10-21', '2014-10-21');
      rows.should.length(1);
      rows[0].count.should.equal(1000);

      // save again
      data = {
        date: '2014-10-21',
        name: 'plusModuleTotal-module',
        count: 3
      };
      yield* DownloadTotal.plusModuleTotal(data);
      rows = yield* DownloadTotal.getModuleTotal(
        'plusModuleTotal-module', '2014-10-21', '2014-10-21');
      rows.should.length(1);
      rows[0].count.should.equal(1003);
    });
  });
});
