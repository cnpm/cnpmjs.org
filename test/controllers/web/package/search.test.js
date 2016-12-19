/*!
 * cnpmjs.org - test/controllers/web/package/search.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <m@fengmk2.com> (http://fengmk2.com)
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

  var app_reg;

  before(function (done) {
    var pkg = utils.getPackage('@cnpmtest/testmodule-web-search', '0.0.1', utils.admin);
    pkg.versions['0.0.1'].dependencies = {
      bytetest: '~0.0.1',
      mocha: '~1.0.0',
      'testmodule-web-show': '0.0.1'
    };

    app_reg = registry.listen();
    
    request(app_reg)
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
      .expect({
        keyword: '@cnpmtest/testmodule-web-search',
        match: { name: '@cnpmtest/testmodule-web-search', description: '' },
        packages: [ { name: '@cnpmtest/testmodule-web-search', description: '' } ],
        keywords: []
      })
      .expect('content-type', 'application/json; charset=utf-8', done);
    });

    it('should search with jsonp work', function (done) {
      request(app)
      .get('/browse/keyword/@cnpmtest/testmodule-web-search?type=json&callback=foo')
      .expect(200)
      .expect('/**/ typeof foo === \'function\' && foo({"keyword":"@cnpmtest/testmodule-web-search","match":{"name":"@cnpmtest/testmodule-web-search","description":""},"packages":[{"name":"@cnpmtest/testmodule-web-search","description":""}],"keywords":[]});')
      .expect('content-type', 'application/javascript; charset=utf-8', done);
    });

    it('should list no match ok', function (done) {
      request(app)
      .get('/browse/keyword/notexistpackage')
      .expect(200)
      .expect(/Can not found package match notexistpackage/, done);
    });


    describe('GET /browse/keyword/:word searchlist', function () {

      before(function (done) {
        var pkg = utils.getPackage('@cnpmtest/testmodule-web-search_a', '0.0.1', utils.admin);
        pkg.versions['0.0.1'].dependencies = {
          bytetest: '~0.0.1',
          mocha: '~1.0.0',
          'testmodule-web-show': '0.0.1'
        };
        request(app_reg)
          .put('/' + pkg.name)
          .set('authorization', utils.adminAuth)
          .send(pkg)
          .expect(201, done);
      });

      it('should list by keyword with json(default limit=100)', function (done) {
          request(app)
          .get('/browse/keyword/@cnpmtest/testmodule-web-searc?type=json')
          .expect(200)
          .expect({
            keyword: '@cnpmtest/testmodule-web-searc',
            match: null,
            packages: [ { name: '@cnpmtest/testmodule-web-search', description: '' },
            { name: '@cnpmtest/testmodule-web-search_a', description: '' }],
            keywords: []
          })
          .expect('content-type', 'application/json; charset=utf-8', done);
      });

      it('should list by keyword with json(use limit)', function (done) {
          request(app)
          .get('/browse/keyword/@cnpmtest/testmodule-web-searc?type=json&limit=1')
          .expect(200)
          .expect({
            keyword: '@cnpmtest/testmodule-web-searc',
            match: null,
            packages: [ { name: '@cnpmtest/testmodule-web-search', description: '' }],
            keywords: []
          })
          .expect('content-type', 'application/json; charset=utf-8', done);
      });

    });
  });
});
