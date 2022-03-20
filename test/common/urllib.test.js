'use strict';

const assert = require('assert');
const mm = require('mm');
const urllib = require('../../common/urllib');
const config = require('../../config');

describe('test/common/urllib.test.js', () => {
  describe('accelerate request', () => {
    beforeEach(() => {
      mm(config, 'accelerateHostMap', {
        'www.alipay.com': 'www.antgroup.com',
        'www.google.com': 'www.google.com'
      });
    });

    describe('direct', () => {
      it('should work', function* () {
        const res = yield urllib.request('https://www.alipay.com', {
          followRedirect: true,
          timeout: 30000,
        });
        assert.deepStrictEqual(res.res.requestUrls, [
          'https://www.antgroup.com/',
        ]);
      });
    });

    describe.skip('redirect', () => {
      it('should work', function* () {
        const res = yield urllib.request('https://google.com', {
          followRedirect: true,
          timeout: 30000,
        });
        assert.deepStrictEqual(res.res.requestUrls, [
          'https://google.com/',
          'https://www.google.com/',
        ]);
      });
    });
  });
});
