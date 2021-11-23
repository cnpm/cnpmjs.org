'use strict';

const assert = require('assert');
const blocklist = require('../../services/blocklist');

describe('test/services/blocklist.test.js', () => {
  describe('blockPackageVersion()', () => {
    it('should block one package version ', function* () {
      yield blocklist.blockPackageVersion('test-block-name-other', '1.0.0', 'only for test');

      yield blocklist.blockPackageVersion('test-block-name', '1.0.0', 'only for test');
      const blocks1 = yield blocklist.findBlockPackageVersions('test-block-name');
      assert(Object.keys(blocks1).length === 1);
      assert(blocks1['1.0.0'].reason === 'only for test');
      // block again
      yield blocklist.blockPackageVersion('test-block-name', '1.0.0', 'only for test new');
      const blocks2 = yield blocklist.findBlockPackageVersions('test-block-name');
      assert(Object.keys(blocks2).length === 1);
      assert(blocks2['1.0.0'].reason === 'only for test new');

      // block all versions
      yield blocklist.blockPackageVersion('test-block-name', '*', 'only for test all');
      const blocks3 = yield blocklist.findBlockPackageVersions('test-block-name');
      assert(Object.keys(blocks3).length === 2);
      assert(blocks3['*'].reason === 'only for test all');
    });
  });
});
