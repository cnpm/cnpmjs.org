/*!
 * cnpmjs.org - test/controllers/web/package/search.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var mm = require('mm');
var app = require('../../../../servers/web');
var registry = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('controllers/web/package/search.test.js', function () {
  before(function (done) {
    var pkg = utils.getPackage('@cnpmtest/testmodule-web-search', '0.0.1', utils.admin);
    pkg.versions['0.0.1'].dependencies = {
      bytetest: '~0.0.1',
      mocha: '~1.0.0',
      'testmodule-web-show': '0.0.1'
    };
    request(registry.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);
  });

  afterEach(mm.restore);

  describe('GET /browse/keyword/:word', function () {
    it('should list by keyword ok', function (done) {
      request(app)
      .get('/browse/keyword/@cnpmtest/testmodule-web-search')
      .expect(200)
      .expect(/Packages match/, done);
    });

    it('should list by keyword with json ok', function (done) {
      request(app)
      .get('/browse/keyword/@cnpmtest/testmodule-web-search?type=json')
      .expect(200)
      .expect('content-type', 'application/json; charset=utf-8', done);
    });

    it('should list no match ok', function (done) {
      request(app)
      .get('/browse/keyword/notexistpackage')
      .expect(200)
      .expect(/Can not found package match notexistpackage/, done);
    });
  });
});
