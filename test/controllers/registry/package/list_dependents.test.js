/**!
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

const pedding = require('pedding');
const request = require('supertest');
const mm = require('mm');
const app = require('../../../../servers/registry');
const utils = require('../../../utils');

describe('test/controllers/registry/package/list_dependents.test.js', function () {
  afterEach(mm.restore);

  before(function (done) {
    done = pedding(2, done);
    const pkg = utils.getPackage('@cnpmtest/testmodule-list-dependents1', '1.0.0', utils.admin);
    pkg.versions['1.0.0'].dependencies = {
      '@cnpmtest/testmodule-list-dependents2': '~1.0.0',
    };
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);

    const pkg2 = utils.getPackage('@cnpmtest/testmodule-list-dependents2', '1.0.0', utils.admin);
    request(app.listen())
    .put('/' + pkg2.name)
    .set('authorization', utils.adminAuth)
    .send(pkg2)
    .expect(201, done);
  });

  it('should list package dependents', function (done) {
    request(app)
    .get('/-/package/@cnpmtest/testmodule-list-dependents2/dependents')
    .expect({
      dependents: [
        '@cnpmtest/testmodule-list-dependents1',
      ],
    })
    .expect(200, done);
  });
});
