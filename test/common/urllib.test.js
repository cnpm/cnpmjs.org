'use strict';

const assert = require('assert');
const mm = require('mm');
const urllib = require('../../common/urllib');
const config = require('../../config');

describe('test/common/urllib.test.js', () => {
  describe('accelerate request', () => {
    beforeEach(() => {
      mm(config, 'accelerateHostMap', {
        'www.alipay.com': 'www.antgroup.com'
      });
    });

    describe('direct', () => {
      it('should work', function* () {
        const res = yield urllib.request('https://www.alipay.com', {
          followRedirect: true,
        });
        assert.deepStrictEqual(res.res.requestUrls, [
          'https://www.antgroup.com/',
        ]);
      });
    });

    describe('redirect', () => {
      it('should work', function* () {
        const res = yield urllib.request('http://alipay.com', {
          followRedirect: true,
        });
        assert.deepStrictEqual(res.res.requestUrls, [
          'http://alipay.com/',
          'https://www.antgroup.com/',
        ]);
      });
    });
  });
});
