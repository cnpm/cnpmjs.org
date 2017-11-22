'use strict';

var request = require('supertest');
var mm = require('mm');
var app = require('../../servers/web');
var config = require('../../config');

describe('middleware/opensearch.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });
  after(function (done) {
    app.close(done);
  });
  afterEach(mm.restore);

  describe('GET /opensearch.xml', function () {
    it('should get 200', function (done) {
      request(app)
      .get('/opensearch.xml')
      .set('host', 'localhost')
      .expect(/http:\/\/localhost\//, done);
    });

    it('should return custom opensearch host', function (done) {
      mm(config.opensearch, 'host', 'foo.com');
      request(app)
      .get('/opensearch.xml')
      .set('host', 'localhost:6002')
      .expect(/http:\/\/foo\.com\/browse\/keyword\//, done);
    });
  });
});
