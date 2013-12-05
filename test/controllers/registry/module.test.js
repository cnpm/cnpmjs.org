/*!
 * cnpmjs.org - test/controllers/registry/module.test.js
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
var request = require('supertest');
var app = require('../../../servers/registry');

describe('controllers/registry/module.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });
  after(function (done) {
    app.close(done);
  });

  describe('GET /:name', function () {
    it('should return module info', function (done) {
      request(app)
      .get('/cnpmjs.org')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.body.should.have.keys('_id', '_rev', 'name', 'description',
          'versions', 'dist-tags', 'readme', 'maintainers',
          'time', 'author', 'repository', '_attachments');
        res.body.author.should.eql({
          "name": "fengmk2",
          // "email": "fengmk2@gmail.com",
          // "url": "http://fengmk2.github.com"
        });
        res.body.name.should.equal('cnpmjs.org');
        done();
      });
    });
  });
});
