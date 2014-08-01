/**!
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
var pedding = require('pedding');
var mm = require('mm');
var path = require('path');
var Npm = require('../../proxy/npm');
var registryApp = require('../../servers/registry');
var webApp = require('../../servers/web');

describe('controllers/sync.test.js', function () {
  before(function (done) {
    done = pedding(2, done);
    registryApp = registryApp.listen(0, done);
    webApp = webApp.listen(0, done);
  });

  afterEach(mm.restore);

  var baseauth = 'Basic ' + new Buffer('cnpmjstest10:cnpmjstest10').toString('base64');
  var baseauthOther = 'Basic ' + new Buffer('cnpmjstest101:cnpmjstest101').toString('base64');
  var fixtures = path.join((path.dirname(__dirname)), 'fixtures');

  describe('sync source npm package', function () {
    var logIdRegistry;
    var logIdWeb;

    it('should sync as publish success', function (done) {
      request(registryApp)
      .del('/pedding/-rev/123')
      .set('authorization', baseauth)
      .end(function (err, res) {
        should.not.exist(err);

        mm.data(Npm, 'get', require(path.join(fixtures, 'utility.json')));
        request(registryApp)
        .put('/pedding/sync?publish=true&nodeps=true')
        .set('authorization', baseauth)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.keys('ok', 'logId');
          logIdRegistry = res.body.logId;
          done();
        });
      });
    });

    it('should sync as publish 403 when user not admin', function (done) {
      mm.data(Npm, 'get', require(path.join(fixtures, 'utility.json')));
      request(registryApp)
      .put('/utility_unit_test/sync?publish=true&nodeps=true')
      .expect(403)
      .expect({
        error: 'no_perms',
        reason: 'Only admin can publish'
      }, done);
    });

    it('should sync through web success', function (done) {
      mm.data(Npm, 'get', require(path.join(fixtures, 'utility.json')));
      request(webApp)
      .put('/sync/pedding')
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'logId');
        logIdWeb = res.body.logId;
        done();
      });
    });

    it('should sync through registry success', function (done) {
      mm.data(Npm, 'get', require(path.join(fixtures, 'utility.json')));
      request(registryApp)
      .put('/pedding/sync')
      .set('authorization', baseauth)
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'logId');
        logIdRegistry = res.body.logId;
        done();
      });
    });

    it('should get sync log', function (done) {
      done = pedding(2, done);
      request(registryApp)
      .get('/pedding/sync/log/' + logIdRegistry)
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'log');
        done();
      });

      request(webApp)
      .get('/sync/pedding/log/' + logIdWeb)
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'log');
        done();
      });
    });
  });

  describe('scope package', function () {
    it('should sync scope package not found', function (done) {
      request(webApp)
      .put('/sync/@cnpm/not-exists-package')
      .expect(404, done);
    });
  });
});
