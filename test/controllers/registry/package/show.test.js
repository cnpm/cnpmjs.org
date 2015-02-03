/**!
 * cnpmjs.org - test/controllers/registry/package/show.test.js
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
var app = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('controllers/registry/package/show.test.js', function () {
  afterEach(mm.restore);

  before(function (done) {
    var pkg = utils.getPackage('@cnpmtest/testmodule-show', '0.0.1', utils.admin);
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  it('should return one version', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show/0.0.1')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-show');
      data.version.should.equal('0.0.1');
      data.dist.tarball.should.containEql('/@cnpmtest/testmodule-show/download/@cnpmtest/testmodule-show-0.0.1.tgz');
      done();
    });
  });

  it('should return latest tag', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show/latest')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-show');
      data.version.should.equal('0.0.1');
      done();
    });
  });

  it('should 404 when package not exist', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show-not-exists/latest')
    .expect(404, done);
  });

  it('should return scoped package one version', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show/0.0.1')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-show');
      data.version.should.equal('0.0.1');
      done();
    });
  });

  it('should dont sync scoped package not exist', function (done) {
    request(app.listen())
    .get('/@cnpmtest/testmodule-show-not-exists/latest')
    .expect(404, done);
  });

  describe('show sync package', function () {
    before(function (done) {
      utils.sync('baidu', done);
    });

    it('should 200 when source npm exists', function (done) {
      request(app.listen())
      .get('/baidu/latest')
      .expect(200, done);
    });
  });
});
