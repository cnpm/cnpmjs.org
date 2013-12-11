/*!
 * cnpmjs.org - test/controllers/sync.test.js
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

var request = require('supertest');
var should = require('should');
var registryApp = require('../../servers/registry');
var webApp = require('../../servers/web');
var pedding = require('pedding');
var mm = require('mm');
var Npm = require('../../proxy/npm');
var path = require('path');

describe('controllers/sync.test.js', function () {
  before(function (done) {
    done = pedding(2, done);
    registryApp.listen(0, done);
    webApp.listen(0, done);
  });

  afterEach(mm.restore);

  var baseauth = 'Basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64');
  var baseauthOther = 'Basic ' + new Buffer('cnpmjstest101:cnpmjstest101').toString('base64');
  var fixtures = path.join((path.dirname(__dirname)), 'fixtures');

  describe('sync source npm package', function () {
    var logIdRegistry;
    var logIdWeb;
    it('should sync success', function (done) {
      mm.data(Npm, 'get', require(path.join(fixtures, 'utility.json')));
      done = pedding(2, done);
      request(registryApp)
      .put('/utility/sync')
      .set('authorization', baseauth)
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'logId');
        logIdRegistry = res.body.logId;
        done();
      });
      request(webApp)
      .put('/sync/utility')
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'logId');
        logIdWeb = res.body.logId;
        done();
      });
    });

    it('should get sync log', function (done) {
      done = pedding(2, done);
      request(registryApp)
      .get('/utility/sync/log/' + logIdRegistry)
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'log');
        done();
      });

      request(webApp)
      .get('/sync/utility/log/' + logIdWeb)
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'log');
        done();
      });
    });
  });
});
