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

  it('should return a module info from source npm', function *() {
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
      var data = yield npm.get('pedding-not-exists');
      throw new Error('should not run this');
    } catch (err) {
      err.name.should.equal('JSONResponseFormatError');
    }
  });

  it('should return ServerError when http 500 response', function *() {
    var content = fs.createReadStream(path.join(fixtures, '500.txt'));
    mm.http.request(/\//, content, { statusCode: 500 });
    // http://registry.npmjs.org/octopie
    try {
      var data = yield* npm.get('octopie');
      throw new Error('should not run this');
    } catch (err) {
      err.name.should.equal('NPMServerError');
      err.message.should.equal('Status 500, ' + fs.readFileSync(path.join(fixtures, '500.txt'), 'utf8'));
    }
  });
});
