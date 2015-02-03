/**!
 * cnpmjs.org - test/controllers/registry/user_package.test.js
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

describe('controllers/registry/user_package.test.js', function () {
  before(function (done) {
    done = pedding(2, done);
    // sync pedding
    utils.sync('pedding', done);
    var pkg = utils.getPackage('@cnpmtest/test-user-package-module', '0.0.1', utils.otherAdmin2);
    request(app)
    .put('/' + pkg.name)
    .set('authorization', utils.otherAdmin2Auth)
    .send(pkg)
    .expect(201, done);
  });

  describe('listOne()', function () {
    it('should return one user\'s all package names', function (done) {
      request(app.listen())
      .get('/-/by-user/fengmk2')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.fengmk2.should.be.an.Array;
        res.body.fengmk2.should.containEql('pedding');
        done();
      });
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
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.fengmk2.should.be.an.Array;
        res.body.fengmk2.should.containEql('pedding');
        res.body['dead-horse'].should.be.an.Array;
        res.body['dead-horse'].should.containEql('pedding');
        done();
      });

      request(app.listen())
      .get('/-/by-user/fengmk2|dead-horse')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.fengmk2.should.be.an.Array;
        res.body.fengmk2.should.containEql('pedding');
        res.body['dead-horse'].should.be.an.Array;
        res.body['dead-horse'].should.containEql('pedding');
        done();
      });
    });

    it('should return some exists user\'s all package names', function (done) {
      done = pedding(2, done);

      request(app.listen())
      .get('/-/by-user/' + encodeURIComponent('fengmk2|user-not-exists'))
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.fengmk2.should.be.an.Array;
        res.body.fengmk2.should.containEql('pedding');
        done();
      });

      request(app.listen())
      .get('/-/by-user/' + utils.otherAdmin2 + '|fengmk2|user-not-exists|')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.fengmk2.should.be.an.Array;
        res.body.fengmk2.should.containEql('pedding');
        done();
      });
    });

    it('should return {} when users not exists', function (done) {
      request(app.listen())
      .get('/-/by-user/user-not-exists1|user-not-exists2')
      .expect(200)
      .expect({}, done);
    });

    it('should return {} when first user name empty', function (done) {
      done = pedding(2, done);

      request(app.listen())
      .get('/-/by-user/|user-not-exists2')
      .expect(200)
      .expect({}, done);

      request(app.listen())
      .get('/-/by-user/|')
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
