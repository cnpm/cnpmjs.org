/* !
 * cnpmjs.org - test/controllers/web/package/list_privates.test.js
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

const request = require('supertest');
const mm = require('mm');
const app = require('../../../../servers/web');
const registry = require('../../../../servers/registry');
const config = require('../../../../config');
const utils = require('../../../utils');

describe('controllers/web/package/list_privates.test.js', function() {
  afterEach(mm.restore);

  before(function(done) {
    mm(config, 'privatePackages', [ 'testmodule-web-list_privates-no-scoped', 'hsf-haha' ]);
    const pkg = utils.getPackage('@cnpm/testmodule-web-list_privates', '0.0.1', utils.admin);
    request(registry.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, function(err) {
      (err === null).should.equal(true);
      const pkg = utils.getPackage('testmodule-web-list_privates-no-scoped', '0.0.1', utils.admin);
      request(registry.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201, done);
    });
  });

  describe('GET /privates', function() {
    it('should response no private packages', function(done) {
      mm(config, 'scopes', [ '@not-exists-scope-name' ]);
      request(app.listen())
      .get('/privates')
      .expect(/Can not found private package/)
      .expect(200, done);
    });

    it('should show @cnpm private packages', function(done) {
      request(app.listen())
      .get('/privates')
      .expect(/Private packages in @cnpm/)
      .expect(/@cnpm\/testmodule\-web\-list_privates/)
      .expect(200, done);
    });

    it('should show contain no scoped private packages', function(done) {
      mm(config, 'privatePackages', [ 'testmodule-web-list_privates-no-scoped', 'hsf-haha' ]);
      request(app.listen())
      .get('/privates')
      .expect(/Private packages in no scoped/)
      .expect(/testmodule-web-list_privates-no-scoped/)
      .expect(200, done);
    });
  });
});
