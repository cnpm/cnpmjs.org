/**!
 * cnpmjs.org - test/controllers/registry/package/list_shorts.test.js
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

const should = require('should');
const request = require('supertest');
const mm = require('mm');
const config = require('../../../../config');
const app = require('../../../../servers/registry');
const utils = require('../../../utils');

describe('controllers/registry/package/list_shorts.test.js', function() {
  afterEach(mm.restore);

  before(function(done) {
    mm(config, 'syncModel', 'all');
    utils.sync('pedding', done);
  });

  describe('GET /-/short', function() {
    it('should get 200', function(done) {
      request(app)
      .get('/-/short')
      .expect(200, function(err, res) {
        should.not.exist(err);
        res.body.should.be.an.Array;
        res.body.length.should.above(0);
        res.body.indexOf('pedding').should.above(-1);
        done();
      });
    });
  });
});
