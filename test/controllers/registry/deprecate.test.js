/**!
 * cnpmjs.org - test/controllers/registry/deprecate.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var should = require('should');
var request = require('supertest');
var mm = require('mm');
var pedding = require('pedding');
var app = require('../../../servers/registry');
var utils = require('../../utils');

var fixtures = path.join(path.dirname(path.dirname(__dirname)), 'fixtures');

describe('controllers/registry/deprecate.test.js', function () {
  var pkgname = 'testmodule-deprecate';
  before(function (done) {
    done = pedding(2, done);
    var pkg = utils.getPackage(pkgname, '0.0.1', utils.admin);

    request(app.listen())
    .put('/' + pkgname)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, function (err) {
      should.not.exist(err);
      pkg = utils.getPackage(pkgname, '0.0.2', utils.admin);
      // publish 0.0.2
      request(app.listen())
      .put('/' + pkgname)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });

    pkg = utils.getPackage(pkgname, '1.0.0', utils.admin);
    request(app.listen())
    .put('/' + pkgname)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  afterEach(mm.restore);

  describe('PUT /:name', function () {
    it('should deprecate version@1.0.0', function (done) {
      request(app.listen())
      .put('/' + pkgname)
      .set('authorization', utils.adminAuth)
      .send({
        name: pkgname,
        versions: {
          '1.0.0': {
            deprecated: 'mock test deprecated message'
          }
        }
      })
      .expect({
        ok: true
      })
      .expect(201, function (err, res) {
        should.not.exist(err);
        request(app.listen())
        .get('/' + pkgname + '/1.0.0')
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.deprecated.should.equal('mock test deprecated message');
          done();
        });
      });
    });

    it('should deprecate version@<1.0.0', function (done) {
      request(app.listen())
      .put('/' + pkgname)
      .set('authorization', utils.adminAuth)
      .send({
        name: pkgname,
        versions: {
          '0.0.1': {
            deprecated: 'mock test deprecated message'
          },
          '0.0.2': {
            deprecated: 'mock test deprecated message'
          }
        }
      })
      .expect({
        ok: true
      })
      .expect(201, function (err, res) {
        should.not.exist(err);
        done = pedding(2, done);

        request(app.listen())
        .get('/' + pkgname + '/0.0.1')
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.deprecated.should.equal('mock test deprecated message');
          done();
        });

        request(app.listen())
        .get('/' + pkgname + '/0.0.2')
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.deprecated.should.equal('mock test deprecated message');
          done();
        });
      });
    });

    it('should 404 deprecate not exists version', function (done) {
      request(app.listen())
      .put('/' + pkgname)
      .set('authorization', utils.adminAuth)
      .send({
        name: pkgname,
        versions: {
          '1.0.1': {
            deprecated: 'mock test deprecated message'
          },
          '1.0.0': {
            deprecated: 'mock test deprecated message'
          }
        }
      })
      .expect({
        error: 'version_error',
        reason: 'Some versions: ["1.0.1","1.0.0"] not found'
      })
      .expect(400, done);
    });
  });
});
