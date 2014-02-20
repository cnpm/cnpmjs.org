/*!
 * cnpmjs.org - test/controllers/total.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var request = require('supertest');
var registryApp = require('../../servers/registry');
var webApp = require('../../servers/web');
var pedding = require('pedding');

describe('controllers/total.test.js', function () {
  before(function (done) {
    done = pedding(2, done);
    registryApp.listen(0, done);
    webApp.listen(0, done);
  });
  after(function (done) {
    done = pedding(2, done);
    registryApp.close(done);
    webApp.close(done);
  });

  describe('GET / in registry', function () {
    it.only('should return total info', function (done) {
      request(registryApp)
      .get('/')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.db_name.should.equal('registry');
        res.body.node_version.should.equal(process.version);
        done();
      });
    });

    it('should return total info by jsonp', function (done) {
      request(registryApp)
      .get('?callback=totalCallback')
      .expect(200)
      .expect(/totalCallback\({.*}\)/, done);
    });
  });
  describe('GET /total in web', function () {
    it('should return total info', function (done) {
      request(webApp)
      .get('/total')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.db_name.should.equal('registry');
        res.body.node_version.should.equal(process.version);
        done();
      });
    });
  });
});
