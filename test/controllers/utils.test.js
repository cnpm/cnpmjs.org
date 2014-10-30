/**!
 * cnpmjs.org - test/controllers/utils.test.js
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

var utils = require('../../controllers/utils');

describe('controllers/utils.test.js', function () {
  describe('setLicense()', function () {
    it('should only use the first license', function () {
      var p = {license: ['MIT']};
      utils.setLicense(p);
      p.license.should.have.keys('name', 'url');
      p.license.should.eql({
        name: 'MIT',
        url: 'http://opensource.org/licenses/MIT'
      });

      p = {license: ['http://foo/MIT']};
      utils.setLicense(p);
      p.license.should.have.keys('name', 'url');
      p.license.should.eql({
        name: 'http://foo/MIT',
        url: 'http://foo/MIT'
      });

      p = {license: {name: 'mit', url: 'http://foo/mit'}};
      utils.setLicense(p);
      p.license.should.have.keys('name', 'url');
      p.license.should.eql({
        name: 'mit',
        url: 'http://foo/mit'
      });
    });
  });
});
