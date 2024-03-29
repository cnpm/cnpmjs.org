'use strict';

var mm = require('mm');
var config = require('../../config');
var common = require('../../services/common');

describe('services/common.test.js', function () {
  afterEach(mm.restore);

  describe('isPrivatePackage()', function () {
    it('should detect prviate package', function* () {
      mm(config, 'privatePackages', ['some-private-package', 'foobar2']);
      common.isPrivatePackage('@cnpm/ooxx').should.equal(true);
      common.isPrivatePackage('@cnpm/some-private-package').should.equal(true);
      common.isPrivatePackage('some-private-package').should.equal(true);
      common.isPrivatePackage('foobar2').should.equal(true);

      common.isPrivatePackage('foobar').should.equal(false);
      common.isPrivatePackage('pedding-2').should.equal(false);
      common.isPrivatePackage('@public/some-package').should.equal(false);
    });
  });
});
