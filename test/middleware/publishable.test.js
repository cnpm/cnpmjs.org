'use strict';

var app = require('../../servers/registry');
var config = require('../../config');
var request = require('supertest');
var utils = require('../utils');
var mm = require('mm');

describe('middleware/publishable.test.js', function () {
  afterEach(mm.restore);

  it('should not 403 when admin put to public package', function (done) {
    mm(config, 'enablePrivate', false);
    request(app)
    .put('/koa/-rev/1')
    .set('authorization', utils.adminAuth)
    .send({
      versions: {
        '0.0.1': {},
        '0.0.2': {}
      }
    })
    .expect(404, done);
  });

  it('should not 403 when admin put to unsupported scope package', function (done) {
    mm(config, 'enablePrivate', false);
    request(app)
    .put('/@unsupported/koa/-rev/1')
    .set('authorization', utils.adminAuth)
    .send({
      versions: {
        '0.0.1': {},
        '0.0.2': {}
      }
    })
    .expect(404, done);
  });

  it('should not 403 when normal user put to white list package', function (done) {
    mm(config, 'enablePrivate', false);
    mm(config, 'privatePackages', ['koa'])
    request(app)
    .put('/koa/-rev/1')
    .set('authorization', utils.otherUserAuth)
    .send({
      versions: {
        '0.0.1': {},
        '0.0.2': {}
      }
    })
    .expect(404, done);
  });

  it('should not 403 when normal user put to supported scope', function (done) {
    mm(config, 'enablePrivate', false);
    mm(config, 'scopes', ['@test'])
    request(app)
    .put('/@test/koa/-rev/1')
    .set('authorization', utils.otherUserAuth)
    .send({
      versions: {
        '0.0.1': {},
        '0.0.2': {}
      }
    })
    .expect(404, done);
  });

  it('should 400 when normal user put to unsupported scope', function (done) {
    mm(config, 'enablePrivate', false);
    mm(config, 'scopes', ['@test'])
    request(app)
    .put('/@test1/koa/-rev/1')
    .set('authorization', utils.otherUserAuth)
    .send({
      versions: {
        '0.0.1': {},
        '0.0.2': {}
      }
    })
    .expect(400, done);
  });

  it('should 403 when common user put to public package', function (done) {
    mm(config, 'enablePrivate', false);
    request(app)
    .put('/koa/-rev/1')
    .set('authorization', utils.otherUserAuth)
    .send({
      versions: {
        '0.0.1': {},
        '0.0.2': {}
      }
    })
    .expect(403, done);
  });

  it('should 403 when common user put in private mode', function (done) {
    mm(config, 'enablePrivate', true);
    request(app)
    .put('/koa/-rev/1')
    .set('authorization', utils.otherUserAuth)
    .send({
      versions: {
        '0.0.1': {},
        '0.0.2': {}
      }
    })
    .expect({
      error: 'no_perms',
      reason: 'Private mode enable, only admin can publish this module'
    })
    .expect(403, done);
  });
});
