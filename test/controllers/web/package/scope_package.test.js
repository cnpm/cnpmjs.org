/**!
 * cnpmjs.org - test/controllers/web/package/scope_package.test.js
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

const should = require('should');
const request = require('supertest');
const pedding = require('pedding');
const mm = require('mm');
const config = require('../../../../config');
let registry = require('../../../../servers/registry');
let web = require('../../../../servers/web');
const utils = require('../../../utils');

describe('controllers/web/package/scope_package.test.js', function() {
  const pkgname = '@cnpm/test-web-scope-package';
  const pkgURL = '/@' + encodeURIComponent(pkgname.substring(1));
  before(function(done) {
    done = pedding(2, done);
    registry = registry.listen(0, function() {
      // add scope package
      let pkg = utils.getPackage(pkgname, '0.0.1', utils.admin);
      request(registry)
      .put(pkgURL)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, function(err) {
        should.not.exist(err);
        pkg = utils.getPackage(pkgname, '0.0.2', utils.admin);
        // publish 0.0.2
        request(registry)
        .put(pkgURL)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201, done);
      });
    });
    web = web.listen(0, done);
  });

  beforeEach(function() {
    mm(config, 'scopes', [ '@cnpm', '@cnpmtest' ]);
  });

  afterEach(mm.restore);

  it('should show scope package info page: /@scope%2Fname', function(done) {
    request(web)
    .get('/package' + pkgURL)
    .expect(200, function(err, res) {
      should.not.exist(err);
      const body = res.text;
      body.should.containEql('$ cnpm install @cnpm/test-web-scope-package');
      body.should.containEql('Private package');
      done();
    });
  });

  it('should show scope package info page: encodeURIComponent("/@scope/name")', function(done) {
    request(web)
    .get('/package/' + encodeURIComponent(pkgname))
    .expect(200, function(err, res) {
      should.not.exist(err);
      const body = res.text;
      body.should.containEql('$ cnpm install @cnpm/test-web-scope-package');
      body.should.containEql('Private package');
      done();
    });
  });

  it('should show scope package info page: /@scope/name', function(done) {
    request(web)
    .get('/package/' + pkgname)
    .expect(200, function(err, res) {
      should.not.exist(err);
      const body = res.text;
      body.should.containEql('$ cnpm install @cnpm/test-web-scope-package');
      body.should.containEql('Private package');
      done();
    });
  });

  it('should /package/@scope/name/ 404', function(done) {
    request(web)
    .get('/package/' + pkgname + '/')
    .expect(404, done);
  });

  it('should show scope package with version: /@scope/name/0.0.2', function(done) {
    request(web)
    .get('/package/' + pkgname + '/0.0.2')
    .expect(200, function(err, res) {
      should.not.exist(err);
      const body = res.text;
      body.should.containEql('$ cnpm install @cnpm/test-web-scope-package');
      body.should.containEql('Private package');
      done();
    });
  });

  it('should /@scope/name redirect to /package/@scope/name', function(done) {
    request(web)
    .get('/' + pkgname)
    .expect('Location', '/package/' + pkgname)
    .expect(302, done);
  });
});
