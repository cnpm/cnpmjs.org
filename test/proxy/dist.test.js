/**!
 * cnpmjs.org - test/proxy/dist.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var Dist = require('../../proxy/dist');
var fs = require('fs');
var nfs = require('../../common/nfs');

describe('proxy/dist.test.js', function () {
  describe('savefile() and getfile', function () {
    it('should save and get /npm-versions.txt', function* () {
      var name = 'npm-versions.txt';
      var info = {
        name: name,
        parent: '/',
        date: '15-Sep-2011 23:48',
        size: 1676,
        url: name,
        sha1: '104731881047318810473188'
      };
      yield* Dist.savefile(info);
      fs.writeFileSync(nfs._getpath('npm-versions.txt'), 'npm version');
      var got = yield* Dist.getfile('/npm-versions.txt');
      should.exist(got);
      got.should.eql(info);
    });

    it('should save and get /v1.0.0/npm-versions.txt', function* () {
      var name = 'v1.0.0/npm-versions.txt';
      var info = {
        name: 'npm-versions.txt',
        parent: '/v1.0.0/',
        date: '15-Sep-2011 23:48',
        size: 1676,
        url: 'v1.0.0/npm-versions.txt',
        sha1: '104731881047318810473188'
      };
      yield* Dist.savefile(info);
      fs.writeFileSync(nfs._getpath('npm-versions.txt'), 'npm version 1.0.0');
      var got = yield* Dist.getfile('/v1.0.0/npm-versions.txt');
      should.exist(got);
      got.should.eql(info);
    });
  });
});
