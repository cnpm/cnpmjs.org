/*!
 * cnpmjs.org - test/lib/common.test.js.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var common = require('../../lib/common');

describe('lib/common.test.js', function () {
  describe('isAdmin()', function () {
    it('should admin is admin', function () {
      common.isAdmin('admin').should.equal(true);
      common.isAdmin('fengmk2').should.equal(true);
    });
  });
});
