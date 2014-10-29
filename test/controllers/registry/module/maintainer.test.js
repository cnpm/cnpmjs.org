/**!
 * cnpmjs.org - test/controllers/registry/module/maintainer.test.js
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

var request = require('supertest');
var mm = require('mm');
var config = require('../../../../config');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');

describe('controllers/registry/module/maintainer.test.js', function () {
  var pkgname = '@cnpm/test-package-maintainer';
  var pkgURL = '/@' + encodeURIComponent(pkgname.substring(1));
  before(function (done) {
    app = app.listen(0, function () {
      // add scope package
      var pkg = utils.getPackage(pkgname, '0.0.1', utils.admin);

      request(app)
      .put(pkgURL)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });
  });

  beforeEach(function () {
    mm(config, 'scopes', ['@cnpm', '@cnpmtest']);
  });

  afterEach(mm.restore);

  it('should add new maintainer without custom user service', function (done) {
    mm(config, 'customUserService', false);
    request(app)
    .put('/@cnpm/test-package-maintainer/-rev/1')
    .set('authorization', utils.adminAuth)
    .send({
      maintainers: [
        { name: 'new-maintainer', email: 'new-maintainer@cnpmjs.org' },
        { name: utils.admin, email: utils.admin + '@cnpmjs.org' },
      ]
    })
    .expect(201, done);
  });

  describe('config.customUserService = true', function () {
    it('should add new maintainer fail when user not exists', function (done) {
      mm(config, 'customUserService', true);
      request(app)
      .put('/@cnpm/test-package-maintainer/-rev/1')
      .set('authorization', utils.adminAuth)
      .send({
        maintainers: [
          { name: 'new-maintainer-not-exists', email: 'new-maintainer@cnpmjs.org' },
          { name: 'new-maintainer-not-exists2', email: 'new-maintainer@cnpmjs.org' },
          { name: utils.admin, email: utils.admin + '@cnpmjs.org' },
        ]
      })
      .expect({
        error: 'invalid user name',
        reason: 'User: `new-maintainer-not-exists, new-maintainer-not-exists2` not exists'
      })
      .expect(403, done);
    });

    it('should add new maintainer success when user all exists', function (done) {
      mm(config, 'customUserService', true);
      request(app)
      .put('/@cnpm/test-package-maintainer/-rev/1')
      .set('authorization', utils.adminAuth)
      .send({
        maintainers: [
          { name: 'cnpmjstest101', email: 'cnpmjstest101@cnpmjs.org' },
          { name: 'cnpmjstest102', email: 'cnpmjstest102@cnpmjs.org' },
          { name: utils.admin, email: utils.admin + '@cnpmjs.org' },
        ]
      })
      .expect({
        ok: true,
        id: '@cnpm/test-package-maintainer',
        rev: '1'
      })
      .expect(201, done);
    });
  });
});
