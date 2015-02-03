/**!
 * cnpmjs.org - test/controllers/registry/package/tag.test.js
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

var request = require('supertest');
var mm = require('mm');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('controllers/registry/package/tag.test.js', function () {
  afterEach(mm.restore);

  before(function (done) {
    var pkg = utils.getPackage('@cnpmtest/testmodule-tag-1', '1.0.0', utils.admin);
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  it('should create new tag ok', function (done) {
    request(app)
    .put('/@cnpmtest/testmodule-tag-1/newtag')
    .set('content-type', 'application/json')
    .set('authorization', utils.adminAuth)
    .send('"1.0.0"')
    .expect(201, done);
  });

  it('should override exist tag ok', function (done) {
    request(app)
    .put('/@cnpmtest/testmodule-tag-1/newtag')
    .set('content-type', 'application/json')
    .set('authorization', utils.adminAuth)
    .send('"1.0.0"')
    .expect(201, done);
  });

  it('should 400 when version missing', function (done) {
    request(app)
    .put('/@cnpmtest/testmodule-tag-1/newtag')
    .set('content-type', 'application/json')
    .set('authorization', utils.adminAuth)
    .send('""')
    .expect({
      error: 'version_missed',
      reason: 'version not found'
    })
    .expect(400, done);
  });

  it('should tag invalid version 403', function (done) {
    request(app)
    .put('/@cnpmtest/testmodule-tag-1/newtag')
    .set('content-type', 'application/json')
    .set('authorization', utils.adminAuth)
    .send('"hello"')
    .expect(403)
    .expect({
      error: 'forbidden',
      reason: 'setting tag newtag to invalid version: hello: @cnpmtest/testmodule-tag-1/newtag'
    }, done);
  });

  it('should tag not eixst version 403', function (done) {
    request(app)
    .put('/@cnpmtest/testmodule-tag-1/newtag')
    .set('content-type', 'application/json')
    .set('authorization', utils.adminAuth)
    .send('"5.0.0"')
    .expect(403)
    .expect({
      error: 'forbidden',
      reason: 'setting tag newtag to unknown version: 5.0.0: @cnpmtest/testmodule-tag-1/newtag'
    }, done);
  });

  describe('update tag not maintainer', function () {
    before(function (done) {
      var pkg = utils.getPackage('@cnpmtest/update-tag-not-maintainer', '1.0.0');
      request(app)
      .put('/' + pkg.name)
      .set('content-type', 'application/json')
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });

    it('should not maintainer update tag return no permission 403', function (done) {
      request(app)
      .put('/@cnpmtest/update-tag-not-maintainer/newtag')
      .set('content-type', 'application/json')
      .set('authorization', utils.otherUserAuth)
      .send('"1.0.0"')
      .expect(403)
      .expect({
        error: 'forbidden user',
        reason: 'cnpmjstest101 not authorized to modify @cnpmtest/update-tag-not-maintainer'
      }, done);
    });
  });
});
