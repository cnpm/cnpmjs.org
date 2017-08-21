/**!
 * cnpmjs.org - test/models/module_unpublished.test.js
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

var ModuleUnpublished = require('../../models').ModuleUnpublished;

describe('models/module_unpublished.test.js', function () {
  describe('save()', function () {
    it('should save unpublished info', function* () {
      var pkg = {
        "name": "fengmk2",
        "time": "2014-06-15T16:00:11.507Z",
        "tags": {
          "latest": "0.0.0"
        },
        "maintainers": [
          {
          "name": "fengmk2",
          "email": "fengmk2@gmail.com"
          }
        ],
        "description": "tfs",
        "versions": [
          "0.0.0"
        ]
      };
      var row = yield ModuleUnpublished.save('tfs', pkg);
      row.id.should.above(0);
      row.package.should.eql(pkg);

      // save again should work
      var row2 = yield ModuleUnpublished.save('tfs', pkg);
      row2.id.should.equal(row.id);
      row2.package.should.eql(pkg);
    });
  });

  describe('findByName()', function () {
    before(function* () {
      var pkg = {
        "name": "fengmk2",
        "time": "2014-06-15T16:00:11.507Z",
        "tags": {
          "latest": "0.0.0"
        },
        "maintainers": [
          {
          "name": "fengmk2",
          "email": "fengmk2@gmail.com"
          }
        ],
        "description": "findByName-unpublished-info",
        "versions": [
          "0.0.0"
        ]
      };
      yield ModuleUnpublished.save('findByName-unpublished-info', pkg);
    });

    it('should return unpublished info', function* () {
      var row = yield ModuleUnpublished.findByName('findByName-unpublished-info');
      row.id.should.above(0);
      row.package.description.should.equal('findByName-unpublished-info');
    });

    it('should return null when name not exists', function* () {
      var row = yield ModuleUnpublished.findByName('not-exists');
      (row === null).should.equal(true);
    });
  });
});
