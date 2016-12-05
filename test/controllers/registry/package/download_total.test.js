'use strict';

const request = require('supertest');
const mm = require('mm');
const DownloadTotal = require('../../../../services/download_total');
const app = require('../../../../servers/registry');
const utils = require('../../../utils');

describe('test/controllers/registry/package/download_total.test.js', () => {
  afterEach(mm.restore);

  before(() => {
    const pkg2 = utils.getPackage('@cnpmtest/download_total_test_module', '1.0.1', utils.otherUser);
    return request(app.listen())
      .put('/' + pkg2.name)
      .set('authorization', utils.otherUserAuth)
      .send(pkg2)
      .expect(201);
  });

  it('should error when range error', () => {
    return request(app.listen())
    .get('/downloads/range/2014-10-10:xxxx/koa')
    .expect(400)
    .expect({
      error: 'range_error',
      reason: 'range must be YYYY-MM-DD:YYYY-MM-DD style'
    });
  });

  it('should get package downloads ok', () => {
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

    return request(app.listen())
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
    });
  });

  it('should get total downloads ok', () => {
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

    return request(app.listen())
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
    });
  });

  it('should get scope package downloads ok', () => {
    mm.data(DownloadTotal, 'getModuleTotal', [{
      id: 1,
      count: 10,
      date: '2014-12-03',
      name: '@cnpmtest/download_total_test_module'
    }, {
      id: 1,
      count: 8,
      date: '2014-12-01',
      name: '@cnpmtest/download_total_test_module'
    }, {
      id: 1,
      count: 5,
      date: '2014-12-02',
      name: '@cnpmtest/download_total_test_module'
    }]);

    return request(app.listen())
    .get('/downloads/range/2014-12-01:2014-12-03/@cnpmtest/download_total_test_module')
    .expect(200)
    .expect({
      start: '2014-12-01',
      end: '2014-12-03',
      package: '@cnpmtest/download_total_test_module',
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
    });
  });
});
