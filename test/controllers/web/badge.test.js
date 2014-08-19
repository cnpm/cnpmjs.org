/*!
 * cnpmjs.org - test/controllers/web/badge.test.js
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
var path = require('path');
var pedding = require('pedding');
var mysql = require('../../../common/mysql');
var app = require('../../../servers/web');
var registry = require('../../../servers/registry');
var pkg = require('../../../controllers/web/package');
var utils = require('../../utils');
var config = require('../../../config');

var fixtures = path.join(path.dirname(path.dirname(__dirname)), 'fixtures');

describe('controllers/web/badge.test.js', function () {
  before(function (done) {
    done = pedding(2, done);
    registry = registry.listen(0, function () {
      var pkg = utils.getPackage('badge-test-module', '1.0.1', utils.admin);
      request(registry)
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .end(done);
    });

    app = app.listen(0, done);
  });

  afterEach(mm.restore);

  describe('GET /badge/v/:name.svg', function () {
    it('should show version when package exists', function (done) {
      request(app)
      .get('/badge/v/badge-test-module.svg?style=flat-square')
      .expect('Location', 'https://img.shields.io/badge/cnpm-1.0.1-blue.svg?style=flat-square')
      .expect(302, done);
    });

    it('should show invalid when package not exists', function (done) {
      request(app)
      .get('/badge/v/badge-test-module-not-exists.svg?style=flat')
      .expect('Location', 'https://img.shields.io/badge/cnpm-invalid-lightgrey.svg?style=flat')
      .expect(302, done);
    });
  });
});
