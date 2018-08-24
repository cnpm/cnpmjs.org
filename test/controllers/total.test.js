'use strict';

var should = require('should');
var request = require('supertest');
var app = require('../../servers/registry');

describe('test/controllers/total.test.js', function () {
  describe('GET / in registry', function () {
    it('should return total info', function (done) {
      request(app)
      .get('/')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.db_name.should.equal('registry');
        res.body.store_engine.should.be.a.String;
        res.body.node_version.should.equal(process.version);
        res.body.cache_time.should.be.a.Number;
        // request again should get cache total info
        request(app)
        .get('/')
        .expect(function(res2) {
          res2.body.cache_time.should.equal(res.body.cache_time);
        })
        .expect(200, done);
      });
    });

    it('should return total info by jsonp', function (done) {
      request(app)
      .get('?callback=totalCallback')
      .expect(200)
      .expect(/totalCallback\({.*}\)/, done);
    });
  });
});
