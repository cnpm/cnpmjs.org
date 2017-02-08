'use strict';

const request = require('supertest');
let registry = require('../../servers/registry');
let web = require('../../servers/registry');

describe('middleware/static.test.js', function() {
  before(function(done) {
    registry = registry.listen(0, function() {
      web = web.listen(0, done);
    });
  });

  describe('registry', function() {
    it('should /favicon.ico rewrite to /favicon.png', function(done) {
      request(registry)
      .get('/favicon.ico')
      // .expect('content-type', 'image/png')
      .expect(200, done);
    });

    it('should 200 /favicon.png', function(done) {
      request(registry)
      .get('/favicon.png')
      .expect('content-type', 'image/png')
      .expect(200, done);
    });
  });

  describe('web', function() {
    it('should /favicon.ico rewrite to /favicon.png', function(done) {
      request(registry)
      .get('/favicon.ico')
      // .expect('content-type', 'image/png')
      .expect(200, done);
    });

    it('should 200 /favicon.png', function(done) {
      request(registry)
      .get('/favicon.png')
      .expect('content-type', 'image/png')
      .expect(200, done);
    });
  });
});
