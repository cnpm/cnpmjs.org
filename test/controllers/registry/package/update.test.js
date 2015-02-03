/**!
 * cnpmjs.org - test/controllers/registry/package/update.test.js
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
var config = require('../../../../config');

describe('controllers/registry/package/update.test.js', function () {
  afterEach(mm.restore);

  before(function (done) {
    var pkg = utils.getPackage('@cnpmtest/testmodule-update-1', '1.0.0', utils.otherUser);
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.otherUserAuth)
    .send(pkg)
    .expect(201, function (err) {
      should.not.exist(err);
      var pkg = utils.getPackage('@cnpmtest/testmodule-update-1', '2.0.0', utils.otherUser);
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.otherUserAuth)
      .send(pkg)
      .expect(201, done);
    });
  });

  it('should 404 when update body wrong', function (done) {
    request(app)
    .put('/@cnpmtest/testmodule-update-1/-rev/1')
    .set('authorization', utils.otherUserAuth)
    .send({
      foo: 'bar'
    })
    .expect({
      error: 'not_found',
      reason: 'document not found'
    })
    .expect(404, done);
  });

  describe('PUT /:name/-rev/:rev updatePrivateModuleMaintainers()', function () {
    before(function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest101',
          email: 'fengmk2@cnpmjs.org'
        }]
      })
      .set('authorization', utils.otherUserAuth)
      .expect({
        ok: true,
        id:"@cnpmtest/testmodule-update-1",
        rev: "1"
      }, done);
    });

    it('should add new maintainers by normal users', function (done) {
      done = pedding(2, done);

      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/2')
      .send({
        maintainers: [{
          name: 'cnpmjstest10',
          email: 'fengmk2@cnpmjs.org'
        }, {
          name: 'cnpmjstest101',
          email: 'fengmk2@cnpmjs.org'
        }]
      })
      .set('authorization', utils.otherUserAuth)
      .expect(201)
      .expect({
        ok: true,
        id: '@cnpmtest/testmodule-update-1',
        rev: '2'
      }, function (err) {
        should.not.exist(err);
        // check maintainers update
        request(app)
        .get('/@cnpmtest/testmodule-update-1')
        .expect(200, function (err, res) {
          should.not.exist(err);
          var pkg = res.body;
          pkg.maintainers.should.length(2);
          pkg.maintainers.should.eql(pkg.versions['1.0.0'].maintainers);
          pkg.maintainers.sort(function (a, b) {
            return a.name > b.name ? 1 : -1;
          });
          pkg.maintainers.should.eql([
            { name: 'cnpmjstest10', email: 'fengmk2@gmail.com' },
            { name: 'cnpmjstest101', email: 'fengmk2@gmail.com' },
          ]);
          done();
        });

        request(app)
        .get('/@cnpmtest/testmodule-update-1/1.0.0')
        .expect(200, function (err, res) {
          should.not.exist(err);
          var pkg = res.body;
          pkg.maintainers.should.length(2);
          pkg.maintainers.sort(function (a, b) {
            return a.name > b.name ? 1 : -1;
          });
          pkg.maintainers.should.eql([
            { name: 'cnpmjstest10', email: 'fengmk2@gmail.com' },
            { name: 'cnpmjstest101', email: 'fengmk2@gmail.com' },
          ]);
          done();
        });
      });
    });

    it('should add again new maintainers', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/1')
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

    it('should add new maintainers by admin', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest101',
          email: 'cnpmjstest101@cnpmjs.org'
        }, {
          name: 'fengmk2',
          email: 'fengmk2@cnpmjs.org'
        }]
      })
      .set('authorization', utils.adminAuth)
      .expect(201)
      .expect('content-type', 'application/json; charset=utf-8', done);
    });

    it('should rm maintainers', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/1')
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

    it('should rm again maintainers', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest101',
          email: 'cnpmjstest101@cnpmjs.org'
        }]
      })
      .set('authorization', utils.otherUserAuth)
      .expect(201)
      .expect({
        id: '@cnpmtest/testmodule-update-1',
        rev: '1',
        ok: true
      }, done);
    });

    it('should rm all maintainers forbidden 403', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/1')
      .send({
        maintainers: []
      })
      .set('authorization', utils.otherUserAuth)
      .expect(403)
      .expect({error: 'invalid operation', reason: 'Can not remove all maintainers'})
      .expect('content-type', 'application/json; charset=utf-8', done);
    });

    it('should 403 when not maintainer update', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/1')
      .send({
        maintainers: [{
          name: 'cnpmjstest10',
          email: 'cnpmjstest10@cnpmjs.org'
        }]
      })
      .set('authorization', utils.secondUserAuth)
      .expect(403)
      .expect({
        error: 'forbidden user',
        reason: 'cnpmjstest102 not authorized to modify @cnpmtest/testmodule-update-1'
      }, done);
    });

    describe('forcePublishWithScope = true', function () {
      before(function (done) {
        var pkg = utils.getPackage('@cnpm/testmodule-update-1', '0.0.1', utils.otherUser);
        request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.otherUserAuth)
        .send(pkg)
        .expect(201, function (err) {
          should.not.exist(err);
          pkg = utils.getPackage(pkg.name, '0.0.2', utils.otherUser);
          // publish 0.0.2
          request(app)
          .put('/' + pkg.name)
          .set('authorization', utils.otherUserAuth)
          .send(pkg)
          .expect(201, done);
        });
      });

      it('should 403 add maintainers without scope', function (done) {
        request(app)
        .put('/testmodule-update-1/-rev/1')
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
        .expect(403, done);
      });

      it('should add maintainers ok with scope', function (done) {
        request(app)
        .put('/@cnpm/testmodule-update-1/-rev/1')
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
        .expect( { ok: true, id: '@cnpm/testmodule-update-1', rev: '1' })
        .expect(201, done);
      });
    });

    describe('config.customUserService = true', function () {
      it('should 403 when user not exists', function (done) {
        mm(config, 'customUserService', true);
        request(app)
        .put('/@cnpm/testmodule-update-1/-rev/1')
        .send({
          maintainers: [{
            name: 'cnpmjstest101',
            email: 'cnpmjstest101@cnpmjs.org'
          }, {
            name: 'fengmk2',
            email: 'fengmk2@cnpmjs.org'
          }, {
            name: 'not-exists',
            email: 'not-exists@cnpmjs.org'
          }, {
            name: 'not-exists2',
            email: 'not-exists@cnpmjs.org'
          }]
        })
        .set('authorization', utils.otherUserAuth)
        .expect({
          error: 'invalid user name',
          reason: 'User: `not-exists, not-exists2` not exists'
        })
        .expect(403, done);
      });

      it('should 201 when user are vailds', function (done) {
        mm(config, 'customUserService', true);
        request(app)
        .put('/@cnpm/testmodule-update-1/-rev/1')
        .send({
          maintainers: [{
            name: 'cnpmjstest101',
            email: 'cnpmjstest101@cnpmjs.org'
          }, {
            name: 'fengmk2',
            email: 'fengmk2@cnpmjs.org'
          }, {
            name: 'cnpmjstest102',
            email: 'cnpmjstest102@test.org',
          }]
        })
        .set('authorization', utils.otherUserAuth)
        .expect(201, done);
      });

      it('should 201 when user exists', function (done) {
        mm(config, 'customUserService', true);
        request(app)
        .put('/@cnpm/testmodule-update-1/-rev/1')
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
        .expect(201, done);
      });
    });
  });

  describe('PUT /:name/-rev/:rev updateVersions()', function () {
    it('should update 401 when no auth', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/123')
      .expect(401, done);
    });

    it('should update 403 when auth error', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/123')
      .set('authorization', utils.thirdUserAuth)
      .expect(403, done);
    });

    it('should remove nothing removed ok', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/1')
      .set('authorization', utils.otherUserAuth)
      .send({
        versions: {
          '0.0.1': {},
          '0.0.2': {}
        }
      })
      .expect(201, done);
    });

    it('should remove lastest tag with scoped', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/1')
      .set('authorization', utils.otherUserAuth)
      .send({
        versions: {
          '1.0.0': {},
        }
      })
      .expect(201, function (err) {
        should.not.exist(err);
        // again should work
        request(app)
        .put('/@cnpmtest/testmodule-update-1/-rev/1')
        .set('authorization', utils.otherUserAuth)
        .send({
          versions: {
            '1.0.0': {},
          }
        })
        .expect(201, done);
      });
    });

    it('should 404 when package not exists', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1-not-exists/-rev/1')
      .set('authorization', utils.otherUserAuth)
      .send({
        versions: {
          '0.0.1': {},
          '0.0.2': {}
        }
      })
      .expect(404, done);
    });

    it('should remove all version ok', function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-update-1/-rev/1')
      .set('authorization', utils.otherUserAuth)
      .send({
        versions: {}
      })
      .expect(201, done);
    });
  });
});
