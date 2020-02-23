'use strict';

const should = require('should');
const request = require('supertest');
const mm = require('mm');
const moment = require('moment');
const config = require('../../../../config');
const app = require('../../../../servers/registry');
const utils = require('../../../utils');

describe('test/controllers/registry/package/list_versions.test.js', function () {
  afterEach(mm.restore);

  before(function (done) {
    utils.sync('pedding', done);
  });

  describe('GET /-/allversions', function () {
    it('should get 200', function (done) {
      mm(config, 'syncModel', 'all');
      request(app)
      .get('/-/allversions?date=' + moment().format('YYYY-MM-DD'))
      .expect(200, function (err, res) {
        should.not.exist(err);
        console.log(res.body);
        const rows = res.body;
        rows.length.should.above(0);
        done();
      });
    });

    it('should get 404', function (done) {
      mm(config, 'syncModel', 'all');
      request(app)
      .get('/-/allversions?date=notadsfwe')
      .expect(400, function (err, res) {
        should.not.exist(err);
        res.body.reason.should.equal('[query_parse_error] Invalid value for `date`, should be `YYYY-MM-DD` format.');
        done();
      });
    });
  });
});
