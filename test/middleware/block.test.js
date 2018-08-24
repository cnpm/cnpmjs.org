'use strict';

var request = require('supertest');
var app = require('../../servers/registry');
var web = require('../../servers/web');

describe('test/middleware/block.test.js', function () {
  it('should registry 403 when user-agent is Ruby', function (done) {
    request(app)
    .get('/')
    .set('User-Agent', 'Ruby')
    .expect({
      message: 'forbidden Ruby user-agent, ip: ::ffff:127.0.0.1'
    })
    .expect(403, done);
  });

  it('should web 403 when user-agent is Ruby', function (done) {
    request(web)
    .get('/')
    .set('User-Agent', 'Ruby')
    .expect({
      message: 'forbidden Ruby user-agent, ip: ::ffff:127.0.0.1'
    })
    .expect(403, done);
  });
});
