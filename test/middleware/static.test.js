'use strict';

var should = require('should');
var request = require('supertest');
var registry = require('../../servers/registry');
var web = require('../../servers/registry');

describe('test/middleware/static.test.js', function () {
  describe('registry', function () {
    it('should /favicon.ico rewrite to /favicon.png', function (done) {
      request(registry)
      .get('/favicon.ico')
      // .expect('content-type', 'image/png')
      .expect(200, done);
    });

    it('should 200 /favicon.png', function (done) {
      request(registry)
      .get('/favicon.png')
      .expect('content-type', 'image/png')
      .expect(200, done);
    });
  });

  describe('web', function () {
    it('should /favicon.ico rewrite to /favicon.png', function (done) {
      request(registry)
      .get('/favicon.ico')
      // .expect('content-type', 'image/png')
      .expect(200, done);
    });

    it('should 200 /favicon.png', function (done) {
      request(registry)
      .get('/favicon.png')
      .expect('content-type', 'image/png')
      .expect(200, done);
    });
  });
});
