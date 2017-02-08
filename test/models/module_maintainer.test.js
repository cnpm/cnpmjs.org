'use strict';

const ModuleMaintainer = require('../../models').ModuleMaintainer;

describe('models/module_maintainer.test.js', function() {
  describe('updateMaintainers()', function() {
    it('should update one maintainer', function* () {
      let rs = yield ModuleMaintainer.updateMaintainers('testfoo', [ 'fengmk2' ]);
      rs.should.eql({
        add: [ 'fengmk2' ],
        remove: [],
      });
      // again should be fine
      rs = yield ModuleMaintainer.updateMaintainers('testfoo', [ 'fengmk2' ]);
      rs.should.eql({
        add: [],
        remove: [],
      });
      // remove the exists
      rs = yield ModuleMaintainer.updateMaintainers('testfoo', [ 'fengmk2-1', 'foobar' ]);
      rs.add.sort();
      rs.should.eql({
        add: [ 'fengmk2-1', 'foobar' ],
        remove: [ 'fengmk2' ],
      });
    });

    it('should update multi maintainers', function* () {
      let rs = yield ModuleMaintainer.updateMaintainers('testfoo2', [ 'fengmk23', 'ok', 'foobar' ]);
      rs.add.sort();
      rs.should.eql({
        add: [ 'fengmk23', 'foobar', 'ok' ],
        remove: [],
      });
      // remove exists
      rs = yield ModuleMaintainer.updateMaintainers('testfoo2', [ 'fengmk23' ]);
      rs.remove.sort();
      rs.should.eql({
        add: [],
        remove: [ 'foobar', 'ok' ],
      });
      rs = yield ModuleMaintainer.updateMaintainers('testfoo2', [ 'fengmk23', 'ok', 'foobar' ]);
      rs.add.sort();
      rs.should.eql({
        add: [ 'foobar', 'ok' ],
        remove: [],
      });
    });

    it('should add empty maintainers do nothing', function* () {
      const rs = yield ModuleMaintainer.updateMaintainers('tesfoobar', []);
      rs.should.eql({
        add: [],
        remove: [],
      });
    });
  });
});
