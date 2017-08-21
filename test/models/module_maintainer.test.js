/**!
 * cnpmjs.org - test/models/module_maintainer.test.js
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

var ModuleMaintainer = require('../../models').ModuleMaintainer;

describe('models/module_maintainer.test.js', function () {
  describe('updateMaintainers()', function () {
    it('should update one maintainer', function* () {
      var rs = yield ModuleMaintainer.updateMaintainers('testfoo', ['fengmk2']);
      rs.should.eql({
        add: ['fengmk2'],
        remove: []
      });
      // again should be fine
      var rs = yield ModuleMaintainer.updateMaintainers('testfoo', ['fengmk2']);
      rs.should.eql({
        add: [],
        remove: []
      });
      // remove the exists
      var rs = yield ModuleMaintainer.updateMaintainers('testfoo', ['fengmk2-1', 'foobar']);
      rs.add.sort();
      rs.should.eql({
        add: ['fengmk2-1', 'foobar'],
        remove: ['fengmk2']
      });
    });

    it('should update multi maintainers', function* () {
      var rs = yield ModuleMaintainer.updateMaintainers('testfoo2', ['fengmk23', 'ok', 'foobar']);
      rs.add.sort();
      rs.should.eql({
        add: ['fengmk23', 'foobar', 'ok'],
        remove: []
      });
      // remove exists
      var rs = yield ModuleMaintainer.updateMaintainers('testfoo2', ['fengmk23']);
      rs.remove.sort();
      rs.should.eql({
        add: [],
        remove: ['foobar', 'ok']
      });
      var rs = yield ModuleMaintainer.updateMaintainers('testfoo2', ['fengmk23', 'ok', 'foobar']);
      rs.add.sort();
      rs.should.eql({
        add: ['foobar', 'ok'],
        remove: []
      });
    });

    it('should add empty maintainers do nothing', function* () {
      var rs = yield ModuleMaintainer.updateMaintainers('tesfoobar', []);
      rs.should.eql({
        add: [],
        remove: []
      });
    });
  });
});
