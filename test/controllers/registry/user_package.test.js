/**!
 * cnpmjs.org - test/contributors/registry/user_package.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var request = require('supertest');
var pedding = require('pedding');
var co = require('co');
var app = require('../../../servers/registry');
var SyncModuleWorker = require('../../../proxy/sync_module_worker');
var NpmModuleMaintainer = require('../../../proxy/npm_module_maintainer');
var utils = require('../../utils');

describe('contributors/registry/user_package.test.js', function () {
  before(function (done) {
    co(function* () {
      yield* NpmModuleMaintainer.removeAll('pedding');
    })(function (err) {
      should.not.exist(err);

      // sync pedding
      var worker = new SyncModuleWorker({
        name: 'pedding',
        noDep: true,
      });
      worker.start();
      worker.on('end', done);
    });
  });

  describe('listOne()', function () {
    it('should return one user\'s all package names', function (done) {
      request(app.listen())
      .get('/-/by-user/fengmk2')
      .expect(200)
      .expect({
        fengmk2: [
          'pedding',
        ]
      }, done);
    });

    it('should return {} when user not exists', function (done) {
      request(app.listen())
      .get('/-/by-user/user-not-exists')
      .expect(200)
      .expect({}, done);
    });
  });

  describe('listMulti()', function () {
    it('should return two exists user\'s all package names', function (done) {
      done = pedding(2, done);

      request(app.listen())
      .get('/-/by-user/' + encodeURIComponent('fengmk2|dead-horse'))
      .expect(200)
      .expect({
        fengmk2: [
          'pedding',
        ],
        'dead-horse': [
          'pedding'
        ]
      }, done);

      request(app.listen())
      .get('/-/by-user/fengmk2|dead-horse')
      .expect(200)
      .expect({
        fengmk2: [
          'pedding',
        ],
        'dead-horse': [
          'pedding'
        ]
      }, done);
    });

    it('should return one exists user\'s all package names', function (done) {
      done = pedding(2, done);

      request(app.listen())
      .get('/-/by-user/' + encodeURIComponent('fengmk2|user-not-exists'))
      .expect(200)
      .expect({
        fengmk2: [
          'pedding'
        ]
      }, done);

      request(app.listen())
      .get('/-/by-user/fengmk2|user-not-exists')
      .expect(200)
      .expect({
        fengmk2: [
          'pedding'
        ]
      }, done);
    });

    it('should return {} when users not exists', function (done) {
      request(app.listen())
      .get('/-/by-user/user-not-exists1|user-not-exists2')
      .expect(200)
      .expect({}, done);
    });

    it('should return 200 when users length equal limit count', function (done) {
      request(app.listen())
      .get('/-/by-user/n1|n2|n3|n4|n5|n6|n7|n8|n9|n10|n11|n12|n13|n14|n15|n16|n17|n18|n19|n20')
      .expect(200, done);
    });

    it('should return 400 when users reach limit count', function (done) {
      request(app.listen())
      .get('/-/by-user/n1|n2|n3|n4|n5|n6|n7|n8|n9|n10|n11|n12|n13|n14|n15|n16|n17|n18|n19|n20|n21')
      .expect(400)
      .expect({
        error: 'bad_request',
        reason: 'reach max user names limit, must <= 20 user names'
      }, done);
    });
  });
});
