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
var app = require('../../../servers/registry');
var utils = require('../../utils');

describe('contributors/registry/user_package.test.js', function () {
  before(function (done) {
    // TODO: need to unpublish all exists packages
    var pkg = utils.getPackage('user_package_list_one_package_1', '0.0.1', utils.otherAdmin2);

    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.otherAdmin2Auth)
    .send(pkg)
    .expect(201, function (err) {
      should.not.exists(err);
      pkg = utils.getPackage('user_package_list_one_package_2', '0.0.2', utils.otherAdmin2);
      request(app.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.otherAdmin2Auth)
      .send(pkg)
      .expect(201, function (err) {
        // other admin publish
        should.not.exists(err);
        pkg = utils.getPackage('user_package_list_one_package_3', '1.0.2', utils.otherAdmin3);
        request(app.listen())
        .put('/' + pkg.name)
        .set('authorization', utils.otherAdmin3Auth)
        .send(pkg)
        .expect(201, done);
      });
    });
  });

  describe('listOne()', function () {
    it('should return one user\'s all package names', function (done) {
      request(app.listen())
      .get('/-/by-user/' + utils.otherAdmin2)
      .expect(200)
      .expect({
        cnpmjstestAdmin2: [
          'user_package_list_one_package_1',
          'user_package_list_one_package_2'
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
      .get('/-/by-user/' + encodeURIComponent(utils.otherAdmin2 + '|' + utils.otherAdmin3))
      .expect(200)
      .expect({
        cnpmjstestAdmin2: [
          'user_package_list_one_package_1',
          'user_package_list_one_package_2'
        ],
        cnpmjstestAdmin3: [
          'user_package_list_one_package_3'
        ]
      }, done);

      request(app.listen())
      .get('/-/by-user/' + utils.otherAdmin2 + '|' + utils.otherAdmin3)
      .expect(200)
      .expect({
        cnpmjstestAdmin2: [
          'user_package_list_one_package_1',
          'user_package_list_one_package_2'
        ],
        cnpmjstestAdmin3: [
          'user_package_list_one_package_3'
        ]
      }, done);
    });

    it('should return one exists user\'s all package names', function (done) {
      done = pedding(2, done);

      request(app.listen())
      .get('/-/by-user/' + encodeURIComponent(utils.otherAdmin2 + '|user-not-exists'))
      .expect(200)
      .expect({
        cnpmjstestAdmin2: [
          'user_package_list_one_package_1',
          'user_package_list_one_package_2'
        ]
      }, done);

      request(app.listen())
      .get('/-/by-user/' + utils.otherAdmin2 + '|user-not-exists')
      .expect(200)
      .expect({
        cnpmjstestAdmin2: [
          'user_package_list_one_package_1',
          'user_package_list_one_package_2'
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
