/**!
 * cnpmjs.org - test/controllers/registry/package/deprecate.test.js
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

var should = require('should');
var request = require('supertest');
var mm = require('mm');
var pedding = require('pedding');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('controllers/registry/package/deprecate.test.js', function () {
  var pkgname = '@cnpmtest/testmodule-deprecate';
  before(function (done) {
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
      .expect(201, function (err) {
        should.not.exist(err);
        pkg = utils.getPackage(pkgname, '1.0.0', utils.admin);
        request(app.listen())
        .put('/' + pkgname)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, done);
      });
    });
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
            deprecated: 'mock test deprecated message 1.0.0'
          }
        }
      })
      .expect({
        ok: true
      })
      .expect(201, function (err) {
        should.not.exist(err);
        request(app.listen())
        .get('/' + pkgname + '/1.0.0')
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.deprecated.should.equal('mock test deprecated message 1.0.0');

          // undeprecated
          request(app.listen())
          .put('/' + pkgname)
          .set('authorization', utils.adminAuth)
          .send({
            name: pkgname,
            versions: {
              '1.0.0': {
                deprecated: ''
              }
            }
          })
          .expect({
            ok: true
          })
          .expect(201, function (err) {
            should.not.exist(err);
            request(app.listen())
            .get('/' + pkgname + '/1.0.0')
            .expect(200, function (err, res) {
              should.not.exist(err);
              res.body.deprecated.should.equal('');
              done();
            });
          });
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
          '1.0.0': {
            version: '1.0.0'
          },
          '0.0.1': {
            deprecated: 'mock test deprecated message 0.0.1'
          },
          '0.0.2': {
            deprecated: 'mock test deprecated message 0.0.2'
          }
        }
      })
      .expect({
        ok: true
      })
      .expect(201, function (err) {
        should.not.exist(err);
        done = pedding(3, done);

        request(app.listen())
        .get('/' + pkgname + '/0.0.1')
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.deprecated.should.equal('mock test deprecated message 0.0.1');
          done();
        });

        request(app.listen())
        .get('/' + pkgname + '/0.0.2')
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.deprecated.should.equal('mock test deprecated message 0.0.2');
          done();
        });

        // not change 1.0.0
        request(app.listen())
        .get('/' + pkgname + '/1.0.0')
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.deprecated.should.equal('');
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

    it('should 403 can not modified when use is not maintainer', function (done) {
      request(app.listen())
      .put('/' + pkgname)
      .set('authorization', utils.otherUserAuth)
      .send({
        name: pkgname,
        versions: {
          '1.0.0': {
            version: '1.0.0'
          },
          '0.0.1': {
            deprecated: 'mock test deprecated message 0.0.1'
          },
          '0.0.2': {
            deprecated: 'mock test deprecated message 0.0.2'
          }
        }
      })
      .expect({
        error: 'forbidden user',
        reason: 'cnpmjstest101 not authorized to modify @cnpmtest/testmodule-deprecate, please contact maintainers: cnpmjstest10'
      })
      .expect(403, done);
    });
  });
});
