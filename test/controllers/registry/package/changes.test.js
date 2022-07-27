'use strict';

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('test/controllers/registry/package/changes.test.js', function () {
  afterEach(mm.restore);

  var since;
  before(function (done) {
    since = Date.now();
    var pkg = utils.getPackage('@cnpmtest/test_changes', '0.0.1', utils.admin, 'alpha');
    request(app)
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);

    pkg = utils.getPackage('@cnpmtest/test_changes_gogo', '0.0.2', utils.admin, 'beta');
    request(app)
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  describe('GET /-/all/changes', function () {
    it('should 200', function (done) {
      request(app)
      .get('/-/all/changes?since=' + since)
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.modules.should.be.an.Array();
        res.body._updated.should.be.a.String();
        res.body.modules.length.should.equal(4);
        done();
      });
    });

    it('since should work', function (done) {
      request(app)
      .get('/-/all/changes?since=' + Date.now())
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.modules.should.be.an.Array();
        res.body._updated.should.be.a.String();
        res.body.modules.length.should.equal(0);
        done();
      });
    });

    it('limit should work', function (done) {
      request(app)
      .get('/-/all/changes?limit=1&since=' + since)
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.modules.should.be.an.Array();
        res.body._updated.should.be.a.String();
        res.body.modules.length.should.equal(1);
        done();
      });
    });

    it('cursorId should work', function (done) {
      var count;
      var cursorId;
      request(app)
      .get('/-/all/changes?cursorId=1&since=' + since)
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.modules.should.be.an.Array();
        res.body._updated.should.be.a.String();
        count = res.body.modules.length;
        cursorId = res.body.modules[0].id;

        request(app)
        .get('/-/all/changes?cursorId=' + cursorId + '&since=' + since)
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.modules.should.be.an.Array();
          res.body._updated.should.be.a.String();
          res.body.modules.length.should.equal(count - 1);
          done();
        })
      });
    });
  });
});
