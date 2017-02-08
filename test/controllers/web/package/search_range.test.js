'use strict';

const should = require('should');
const request = require('supertest');
const mm = require('mm');
const app = require('../../../../servers/web');
const registry = require('../../../../servers/registry');
const utils = require('../../../utils');

describe('test/controllers/web/package/search_range.test.js', () => {
  before(function(done) {
    const pkg = utils.getPackage('@cnpmtest/range_testmodule-web-search', '0.0.1', utils.admin);
    pkg.versions['0.0.1'].dependencies = {
      bytetest: '~0.0.1',
      mocha: '~1.0.0',
      'testmodule-web-show': '0.0.1',
    };
    request(registry.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  afterEach(mm.restore);

  describe('GET /_list/search/search', function() {
    it('should search with "m"', function(done) {
      request(app)
      .get('/_list/search/search?startkey="m"&limit=2')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect(200, function(err, res) {
        should.not.exist(err);
        res.body.should.have.keys('rows');
        res.body.rows.length.should.above(0);
        res.body.rows.forEach(function(row) {
          row.should.have.keys('key', 'count', 'value');
          row.value.should.have.keys('name', 'description');
        });
        done();
      });
    });

    it('should search with m', function(done) {
      request(app)
      .get('/_list/search/search?startkey=m&limit=2')
      .expect(200, function(err, res) {
        should.not.exist(err);
        res.body.should.have.keys('rows');
        res.body.rows.length.should.above(0);
        res.body.rows.forEach(function(row) {
          row.should.have.keys('key', 'count', 'value');
          row.value.should.have.keys('name', 'description');
        });
        done();
      });
    });

    it('should search return empty', function(done) {
      request(app)
      .get('/_list/search/search?startkey="cddddsdasdaasds"&limit=2')
      .expect(200, function(err, res) {
        should.not.exist(err);
        res.body.should.eql({ rows: [] });
        done();
      });
    });
  });
});
