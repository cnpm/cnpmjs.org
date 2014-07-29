/*!
 * cnpmjs.org - test/controllers/registry/module/public_mode.test.js
 * Copyright(c) 2014 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var config = require('../../../../config');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('controllers/registry/module/config_private_packages.test.js', function () {
  beforeEach(function () {
    mm(config, 'enablePrivate', false);
    mm(config, 'forcePublishWithScope', true);
    mm(config, 'privatePackages', ['private-package']);
  });

  after(mm.restore);
  it('should publish with tgz base64, addPackageAndDist()', function (done) {
    var pkg = utils.getPackage('private-package', '0.0.1', utils.otherUser);
    request(app)
    .put('/' + pkg.name)
    .set('authorization', utils.otherUserAuth)
    .send(pkg)
    .expect(201, function (err, res) {
      should.not.exist(err);
      res.body.should.have.keys('ok', 'rev');
      res.body.ok.should.equal(true);
      pkg = utils.getPackage('private-package', '0.0.1', utils.otherUser);
      // upload again should 403
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.otherUserAuth)
      .send(pkg)
      .expect(403, function (err, res) {
        should.not.exist(err);
        res.body.should.eql({
          error: 'forbidden',
          reason: 'cannot modify pre-existing version: 0.0.1'
        });
        done();
      });
    });
  });

  it('should other user publish 403', function (done) {
    var pkg = utils.getPackage('private-package', '0.0.2', utils.secondUser);
    request(app)
    .put('/' + pkg.name)
    .set('authorization', utils.secondUserAuth)
    .send(pkg)
    .expect(/forbidden user/)
    .expect(403, done);
  });

  it('should admin publish 403', function (done) {
    var pkg = utils.getPackage('private-package', '0.0.2', utils.admin);
    request(app)
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(/forbidden user/)
    .expect(403, done);
  });

  it('should add again new maintainers', function (done) {
    request(app)
    .put('/private-package/-rev/1')
    .send({
      maintainers: [{
        name: 'cnpmjstest101',
        email: 'cnpmjstest101@cnpmjs.org'
      }, {
        name: 'fengmk2',
        email: 'fengmk2@cnpmjs.org'
      }]
    })
    .set('authorization', utils.otherUserAuth)
    .expect(201)
    .expect('content-type', 'application/json; charset=utf-8', done);
  });

  it('should remove maintainers', function (done) {
    request(app)
    .put('/private-package/-rev/1')
    .send({
      maintainers: [{
        name: 'cnpmjstest101',
        email: 'cnpmjstest101@cnpmjs.org'
      }]
    })
    .set('authorization', utils.otherUserAuth)
    .expect(201)
    .expect('content-type', 'application/json; charset=utf-8', done);
  });
});
