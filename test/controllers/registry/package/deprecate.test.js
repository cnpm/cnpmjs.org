'use strict';

var assert = require('assert');
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

    it('should deprecate version@<1.0.0', function* () {
      yield request(app.listen())
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
        .expect(201);

      yield request(app.listen())
        .get('/' + pkgname + '/0.0.1')
        .expect(200)
        .expect(res => {
          res.body.deprecated.should.equal('mock test deprecated message 0.0.1');
        });

      yield request(app.listen())
        .get('/' + pkgname + '/0.0.2')
        .expect(200)
        .expect(res => {
          res.body.deprecated.should.equal('mock test deprecated message 0.0.2');
        });

      // not change 1.0.0
      yield request(app.listen())
        .get('/' + pkgname + '/1.0.0')
        .expect(200)
        .expect(res => {
          assert(!res.body.deprecated);
        });

      // show deprecated info on abbreviatedMeta request
      yield request(app.listen())
        .get('/' + pkgname)
        .set('accept', 'application/vnd.npm.install-v1+json')
        .expect(200)
        .expect(res => {
          assert(res.body.versions['0.0.2'].deprecated === 'mock test deprecated message 0.0.2');
          assert(res.body.versions['0.0.1'].deprecated === 'mock test deprecated message 0.0.1');
          assert(!res.body.versions['1.0.0'].deprecated);
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
