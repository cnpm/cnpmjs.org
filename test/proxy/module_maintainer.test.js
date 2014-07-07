/**!
 * cnpmjs.org - test/proxy/module_maintainer.test.js
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

var should = require('should');
var ModuleMaintainer = require('../../proxy/module_maintainer');

describe('proxy/module_maintainer.test.js', function () {
  describe('update()', function () {
    it('should update one maintainer', function* () {
      var rs = yield* ModuleMaintainer.update('testfoo', ['fengmk2']);
      rs.should.eql({
        add: ['fengmk2'],
        remove: []
      });
      // again should be fine
      var rs = yield* ModuleMaintainer.update('testfoo', ['fengmk2']);
      rs.should.eql({
        add: ['fengmk2'],
        remove: []
      });
      // remove the exists
      var rs = yield* ModuleMaintainer.update('testfoo', ['fengmk2-1', 'foobar']);
      rs.should.eql({
        add: ['fengmk2-1', 'foobar'],
        remove: ['fengmk2']
      });
    });

    it('should update multi maintainers', function* () {
      var rs = yield* ModuleMaintainer.update('testfoo2', ['fengmk2', 'ok', 'foobar']);
      rs.should.eql({
        add: ['fengmk2', 'ok', 'foobar'],
        remove: []
      });
      // remove exists
      var rs = yield* ModuleMaintainer.update('testfoo2', ['fengmk2']);
      rs.should.eql({
        add: ['fengmk2'],
        remove: ['ok', 'foobar']
      });
      var rs = yield* ModuleMaintainer.update('testfoo3', ['fengmk2', 'ok', 'foobar']);
      rs.should.eql({
        add: ['fengmk2', 'ok', 'foobar'],
        remove: []
      });
    });

    it('should add empty maintainers do nothing', function* () {
      var rs = yield* ModuleMaintainer.update('tesfoobar', []);
      rs.should.eql({
        add: [],
        remove: []
      });
    });
  });
});
