/**!
 * cnpmjs.org - test/services/npm.test.js
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
var mm = require('mm');
var fs = require('fs');
var path = require('path');
var ChunkStream = require('chunkstream');
var npm = require('../../services/npm');

var fixtures = path.join(path.dirname(__dirname), 'fixtures');

describe('services/npm.test.js', function () {
  afterEach(mm.restore);

  it('should return a module info from source npm', function* () {
    var data = yield* npm.get('pedding');
    data.name.should.equal('pedding');
  });

  it('should return null when module not exist', function *() {
    var data = yield* npm.get('pedding-not-exists');
    should.not.exist(data);
  });

  it.skip('should return error when http error', function* () {
    mm.http.request(/\//, new ChunkStream(['{']));
    try {
      yield* npm.get('pedding-not-exists');
      throw new Error('should not run this');
    } catch (err) {
      err.name.should.equal('JSONResponseFormatError');
    }
  });

  it('should return ServerError when http 500 response', function* () {
    var content = fs.createReadStream(path.join(fixtures, '500.txt'));
    mm.http.request(/\//, content, { statusCode: 500 });
    // http://registry.npmjs.org/octopie
    try {
      yield* npm.get('octopie');
      throw new Error('should not run this');
    } catch (err) {
      err.name.should.equal('NPMServerError');
      err.message.should.equal('Status 500, ' + fs.readFileSync(path.join(fixtures, '500.txt'), 'utf8'));
    }
  });

  describe('getPopular()', function () {
    it('should return popular modules', function* () {
      mm.http.request(/\//, JSON.stringify({
        rows: [
          { key: ['foo0'], value: 1 },
          { key: ['foo1'], value: 1 },
          { key: ['foo2'], value: 1 },
          { key: ['foo3'], value: 1 },
          { key: ['foo4'], value: 1 },
          { key: ['foo5'], value: 1 },
          { key: ['foo6'], value: 1 },
          { key: ['foo7'], value: 1 },
          { key: ['foo8'], value: 1 },
          { key: ['foo9'], value: 1 },
          { key: ['foo10'], value: 1 },
          { key: ['underscore'], value: 100 },
          { key: ['foo12'], value: 1 },
          { key: ['foo13'], value: 1 },
          { key: ['foo14'], value: 1 },
          { key: ['foo15'], value: 1 },
        ]
      }));
      var names = yield* npm.getPopular(10);
      names.should.length(10);
      names[0].should.equal('underscore');
    });
  });
});
