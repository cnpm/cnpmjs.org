'use strict';

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');
var CHANGE_TYPE = require('../../../../services/common').CHANGE_TYPE;

describe('test/controllers/registry/package/changes.test.js', function () {
  afterEach(mm.restore);

  var since;
  before(function (done) {
    setTimeout(() => {
      since = Date.now();
      var pkg = utils.getPackage('@cnpmtest/test_changes', '0.0.1', utils.admin, 'alpha');
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function() {
        setTimeout(function() {
          pkg = utils.getPackage('@cnpmtest/test_changes_gogo', '0.0.2', utils.admin, 'beta');
          request(app)
          .put('/' + pkg.name)
          .set('authorization', utils.adminAuth)
          .send(pkg)
          .expect(201, done);
        }, 2000);
      });
    }, 1000);
  });

  describe('GET /-/all/changes', function () {
    it('should 200', function (done) {
      request(app)
        .get("/-/all/changes?since=" + since)
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.results.should.be.an.Array();
          res.body.results
            .filter(function (item) {
              return item.type === CHANGE_TYPE.PACKAGE_VERSION_ADDED;
            })
            .length.should.equal(2);
          res.body.results
            .filter(function (item) {
              return item.type === CHANGE_TYPE.PACKAGE_VERSION_ADDED;
            })
            .length.should.equal(2);
          done();
        });
    });

    it('since should work', function (done) {
      var now = Date.now();
      request(app)
        .get("/-/all/changes?since=" + now + 5000)
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.results.should.be.an.Array();
          res.body.results.length.should.equal(0);
          done();
        });
    });

    it('limit should work', function (done) {
      request(app)
      .get('/-/all/changes?limit=1&since=' + since)
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.results.should.be.an.Array();
        res.body.results.length.should.equal(1);
        done();
      });
    });

  });
});
