/**!
 * cnpmjs.org - test/sync/sync_dist.test.js
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

var mm = require('mm');
var urllib = require('../../common/urllib');
var distsync = require('../../sync/sync_dist');

describe('sync/sync_dist.test.js', function () {
  afterEach(mm.restore);

  describe('listPhantomjsDir()', function () {
    it('should list all phantomjs download infos', function* () {
      var items = yield* distsync.listPhantomjsDir('/phantomjs');
      items.length.should.above(1);
      items.forEach(function (item) {
        item.should.have.keys('name', 'date', 'size', 'type', 'parent', 'downloadURL');
      });
    });
  });

  describe('listdir()', function () {
    it('should list /v0.11.12/', function* () {
      var items = yield* distsync.listdir('/v0.11.12/');
      items[0].name.should.equal('docs/');
      var docsItems = yield* distsync.listdir('/v0.11.12/docs/');
      docsItems[0].name.should.equal('api/');
    });

    it('should list /v0.11.12/docs/api/', function* () {
      var items = yield* distsync.listdir('/v0.11.12/docs/api/');
      items.length.should.above(5);
    });
  });

  describe('listdiff()', function () {
    it('should got all news', function* () {
      mm(urllib, 'request', function () {
        return {
          status: 200,
          data: '<a href="npm/">npm/</a>   06-May-2014 01:18     -\n<a href="npm-versions.txt">npm-versions.txt</a>  27-Feb-2014 00:01         1676',
          headers: {},
        };
      });

      mm(Dist, 'listdir', function* () {
        return [];
      });

      var items = yield* distsync.listdiff('/');
      items.should.eql([
        { name: 'npm/',
          date: '06-May-2014 01:18',
          size: '-',
          type: 'dir',
          parent: '/' },
        { name: 'npm-versions.txt',
          date: '27-Feb-2014 00:01',
          size: 1676,
          type: 'file',
          parent: '/' }
      ]);
    });

    it('should got empty when all exists', function* () {
      mm(urllib, 'request', function () {
        return {
          status: 200,
          data: '<a href="npm/">npm/</a>   06-May-2014 01:18     -\n<a href="npm-versions.txt">npm-versions.txt</a>  27-Feb-2014 00:01         1676',
          headers: {},
        };
      });

      mm(Dist, 'listdir', function* () {
        return [
          {
            name: 'npm/',
            date: '06-May-2014 01:18',
            parent: '/'
          },
          {
            name: 'npm-versions.txt',
            date: '27-Feb-2014 00:01',
            size: 1676,
            parent: '/'
          },
        ];
      });

      var items = yield* distsync.listdiff('/');
      items.should.length(0);
    });

    it('should got date change dir', function* () {
      mm(urllib, 'request', function () {
        return {
          status: 200,
          data: '<a href="npm/">npm/</a>   06-May-2014 01:18     -\n<a href="npm-versions.txt">npm-versions.txt</a>  27-Feb-2014 00:01         1676',
          headers: {},
        };
      });

      mm(Dist, 'listdir', function* () {
        return [
          {
            name: 'npm/',
            date: '06-May-2014 01:17',
            parent: '/'
          },
          {
            name: 'npm-versions.txt',
            date: '27-Feb-2014 00:01',
            size: 1676,
            parent: '/'
          },
        ];
      });

      var items = yield* distsync.listdiff('/');
      items.should.eql([
        { name: 'npm/',
          date: '06-May-2014 01:18',
          size: '-',
          type: 'dir',
          parent: '/' }
      ]);
    });
  });
});
