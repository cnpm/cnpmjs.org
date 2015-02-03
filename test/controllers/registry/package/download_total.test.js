/**!
 * cnpmjs.org - test/controllers/registry/package/download_total.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var mm = require('mm');
var DownloadTotal = require('../../../../services/download_total');
var app = require('../../../../servers/registry');

describe('controllers/registry/package/download_total.test.js', function () {
  afterEach(mm.restore);

  it('should error when range error', function (done) {
    request(app.listen())
    .get('/downloads/range/2014-10-10:xxxx/koa')
    .expect(400)
    .expect({
      error: 'range_error',
      reason: 'range must be YYYY-MM-DD:YYYY-MM-DD style'
    }, done);
  });

  it('should get package downloads ok', function (done) {
    mm.data(DownloadTotal, 'getModuleTotal', [{
      id: 1,
      count: 10,
      date: '2014-12-03',
      name: 'koa'
    }, {
      id: 1,
      count: 8,
      date: '2014-12-01',
      name: 'koa'
    }, {
      id: 1,
      count: 5,
      date: '2014-12-02',
      name: 'koa'
    }]);

    request(app.listen())
    .get('/downloads/range/2014-12-01:2014-12-03/koa')
    .expect(200)
    .expect({
      start: '2014-12-01',
      end: '2014-12-03',
      package: 'koa',
      downloads: [{
        day: '2014-12-01',
        downloads: 8
      }, {
        day: '2014-12-02',
        downloads: 5
      }, {
        day: '2014-12-03',
        downloads: 10
      }]
    }, done);
  });

  it('should get total downloads ok', function (done) {
    mm.data(DownloadTotal, 'getTotal', [{
      count: 20,
      date: '2014-12-03',
    }, {
      count: 8,
      date: '2014-12-01',
    }, {
      count: 5,
      date: '2014-12-02',
    }]);

    request(app.listen())
    .get('/downloads/range/2014-12-01:2014-12-03')
    .expect(200)
    .expect({
      start: '2014-12-01',
      end: '2014-12-03',
      downloads: [{
        day: '2014-12-01',
        downloads: 8
      }, {
        day: '2014-12-02',
        downloads: 5
      }, {
        day: '2014-12-03',
        downloads: 20
      }]
    }, done);
  });
});
