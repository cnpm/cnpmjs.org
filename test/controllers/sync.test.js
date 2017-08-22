'use strict';

var request = require('supertest');
var should = require('should');
var pedding = require('pedding');
var mm = require('mm');
var fs = require('fs');
var path = require('path');
var npmService = require('../../services/npm');
var registryApp = require('../../servers/registry');
var webApp = require('../../servers/web');
var utils = require('../utils');
var config = require('../../config');

describe('test/controllers/sync.test.js', () => {
  afterEach(mm.restore);

  var fixtures = path.join((path.dirname(__dirname)), 'fixtures');
  var mockPackage = JSON.parse(fs.readFileSync(path.join(fixtures, 'utility.json')));

  describe('sync source npm package', function () {
    var logIdRegistry;
    var logIdWeb;
    var logIdRegistry2;

    it('should sync as publish success', function (done) {
      request(registryApp.listen())
      .del('/pedding/-rev/123')
      .set('authorization', utils.adminAuth)
      .end(function (err) {
        should.not.exist(err);
        mm(npmService, 'get', function* () {
          return mockPackage;
        });
        request(registryApp)
        .put('/pedding/sync?publish=true&nodeps=true')
        .set('authorization', utils.adminAuth)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.keys('ok', 'logId');
          logIdRegistry = res.body.logId;
          done();
        });
      });
    });

    it('should sync as publish 403 when user not admin', function (done) {
      mm(npmService, 'get', function* () {
        return mockPackage;
      });
      request(registryApp.listen())
      .put('/utility_unit_test/sync?publish=true&nodeps=true')
      .expect(403)
      .expect({
        error: 'no_perms',
        reason: 'Only admin can publish'
      }, done);
    });

    it('should sync through web success', function (done) {
      mm(npmService, 'get', function* () {
        return mockPackage;
      });
      request(webApp.listen())
      .put('/sync/pedding?sync_upstream=true')
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'logId');
        logIdWeb = res.body.logId;
        done();
      });
    });

    it('should sync through registry success', function (done) {
      mm(npmService, 'get', function* () {
        return mockPackage;
      });
      request(registryApp.listen())
      .put('/pedding/sync')
      .set('authorization', utils.adminAuth)
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'logId');
        logIdRegistry = res.body.logId;
        done();
      });
    });

    it('should get sync log', function (done) {
      done = pedding(2, done);
      request(registryApp.listen())
      .get('/pedding/sync/log/' + logIdRegistry)
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'log');
        done();
      });

      request(webApp.listen())
      .get('/sync/pedding/log/' + logIdWeb + '?offset=1')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'log');
        done();
      });
    });

    it('should sync sync_upstream=true success', function (done) {
      mm(config, 'syncModel', 'all');
      mm(config, 'sourceNpmRegistryIsCNpm', true);
      mm(npmService, 'get', function* () {
        return mockPackage;
      });
      request(registryApp.listen())
      .put('/pedding/sync?sync_upstream=true')
      .set('authorization', utils.adminAuth)
      .end(function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('ok', 'logId');
        logIdRegistry2 = res.body.logId;
        done();
      });
    });

    it('should get sync_upstream=true log', function (done) {
      done = pedding(2, done);
      setTimeout(() => {
        request(registryApp.listen())
        .get('/pedding/sync/log/' + logIdRegistry2)
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.should.have.keys('ok', 'log');
          res.body.log.should.containEql(', syncUpstreamFirst: true');
          done();
        });

        request(webApp.listen())
        .get('/sync/pedding/log/' + logIdRegistry2 + '?offset=1')
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.should.have.keys('ok', 'log');
          done();
        });
      }, 3000);
    });

    it('should 404 when log id not exists', function (done) {
      request(webApp.listen())
      .get('/sync/pedding/log/123123123')
      .expect(404, done);
    });

    it('should 404 when log id not number', function (done) {
      request(webApp.listen())
      .get('/sync/pedding/log/info.php')
      .expect(404, done);
    });
  });

  describe('scope package', function () {
    it('should sync scope package not found', function (done) {
      request(webApp.listen())
      .put('/sync/@cnpm/not-exists-package')
      .expect(201, done);
    });
  });
});
