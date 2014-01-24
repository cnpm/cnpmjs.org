/**!
 * cnpmjs.org - test/proxy/npm.test.js
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
var npm = require('../../proxy/npm');

var fixtures = path.join(path.dirname(__dirname), 'fixtures');

describe('proxy/npm.test.js', function () {
  afterEach(mm.restore);

  it('should return a module info from source npm', function (done) {
    npm.get('pedding', function (err, data) {
      should.not.exist(err);
      should.exist(data);
      data.name.should.equal('pedding');
      done();
    });
  });

  it('should return null when module not exist', function (done) {
    npm.get('pedding-not-exists', function (err, data) {
      should.not.exist(err);
      should.not.exist(data);
      done();
    });
  });

  it('should return error when http error', function (done) {
    mm.http.request(/\//, '{');
    npm.get('pedding-not-exists', function (err, data) {
      should.exist(err);
      err.name.should.equal('JSONResponseFormatError');
      should.not.exist(data);
      done();
    });
  });

  it('should return ServerError when http 500 response', function (done) {
    var content = fs.readFileSync(path.join(fixtures, '500.txt'), 'utf8');
    mm.http.request(/\//, content, { statusCode: 500 });
    // http://registry.npmjs.org/octopie
    npm.get('octopie', function (err, data) {
      should.exist(err);
      err.name.should.equal('NPMServerError');
      err.message.should.equal('Status 500, ' + content);
      done();
    });
  });
});
