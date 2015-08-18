/*!
 * cnpmjs.org - test/lib/common.test.js.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var common = require('../../lib/common');

describe('test/lib/common.test.js', function () {
  describe('isAdmin()', function () {
    it('should admin is admin', function () {
      common.isAdmin('admin').should.equal(true);
      common.isAdmin('fengmk2').should.equal(true);
      common.isAdmin('constructor').should.equal(false);
      common.isAdmin('toString').should.equal(false);
    });
  });

  describe('getCDNKey()', function () {
    it('should auto fix scope filename', function () {
      common.getCDNKey('foo', 'foo-1.0.0.tgz').should.equal('/foo/-/foo-1.0.0.tgz');
      common.getCDNKey('@bar/foo', 'foo-1.0.0.tgz').should.equal('/@bar/foo/-/@bar/foo-1.0.0.tgz');
      common.getCDNKey('@bar/foo', '@bar/foo-1.0.0.tgz').should.equal('/@bar/foo/-/@bar/foo-1.0.0.tgz');
      common.getCDNKey('@bar/foo', '@bar1/foo-1.0.0.tgz').should.equal('/@bar/foo/-/@bar1/foo-1.0.0.tgz');
    });
  });
});
