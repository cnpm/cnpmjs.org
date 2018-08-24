'use strict';

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var config = require('../../../../config');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('test/controllers/registry/package/list_all.test.js', function () {
  afterEach(mm.restore);

  before(function (done) {
    utils.sync('pedding', done);
  });

  describe('GET /-/all', function () {
    it('should get 200', function (done) {
      mm(config, 'syncModel', 'all');
      request(app)
      .get('/-/all')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.be.an.Object;
        res.body._updated.should.be.a.Number;
        Object.keys(res.body).length.should.above(1);
        res.body.pedding.should.equal(true);
        done();
      });
    });
  });
});
