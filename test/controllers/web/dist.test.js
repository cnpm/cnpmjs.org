/**!
 * cnpmjs.org - test/controllers/web/dist.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.cnpmjs.org)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var request = require('supertest');
var pedding = require('pedding');
var mm = require('mm');
var app = require('../../../servers/web');
var Dist = require('../../../proxy/dist');

describe('controllers/web/dist.test.js', function () {
  before(function (done) {
    app.listen(0, done);
  });

  after(function (done) {
    app.close(done);
  });

  afterEach(mm.restore);

  describe('GET /dist/*', function (done) {
    it('should GET /dist redirect to /dist/', function (done) {
      request(app)
      .get('/dist')
      .expect(302)
      .expect('Location', '/dist/', done);
    });

    it('should GET /dist/ show file list', function (done) {
      request(app)
      .get('/dist/')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.text.should.include('<title>Mirror index of http://nodejs.org/dist/</title>');
        done();
      });
    });

    it('should mock return files and dirs', function (done) {
      mm(Dist, 'listdir', function* () {
        return [
          {name: 'ooxx/', date: '02-May-2014 00:54'},
          {name: 'foo.txt', size: 1024, date: '02-May-2014 00:54'},
        ];
      });
      request(app)
      .get('/dist/v1.0.0/')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.text.should.include('<title>Mirror index of http://nodejs.org/dist/v1.0.0/</title>');
        res.text.should.include('<h1>Mirror index of <a target="_blank" href="http://nodejs.org/dist/v1.0.0/">http://nodejs.org/dist/v1.0.0/</a></h1>');
        res.text.should.include('<a href="ooxx/">ooxx/</a>                                             02-May-2014 00:54                   -\n');
        res.text.should.include('<a href="foo.txt">foo.txt</a>                                           02-May-2014 00:54                1024\n');
        done();
      });
    });

    it('should list files and dirs', function (done) {
      mm(Dist, 'listdir', function* () {
        return [
          {name: 'npm/', date: '02-May-2014 00:54'},
          {name: 'npm-versions.txt', size: 1676, date: '02-May-2014 00:54'},
        ];
      });
      request(app)
      .get('/dist/')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(200, function (err, res) {
        should.not.exist(err);
        res.text.should.include('<title>Mirror index of http://nodejs.org/dist/</title>');
        res.text.should.include('<h1>Mirror index of <a target="_blank" href="http://nodejs.org/dist/">http://nodejs.org/dist/</a></h1>');
        res.text.should.include('<a href="npm/">npm/</a>                                              02-May-2014 00:54                   -\n');
        res.text.should.include('<a href="npm-versions.txt">npm-versions.txt</a>                                  02-May-2014 00:54                1676\n');
        done();
      });
    });
  });

  describe('GET /dist/ files', function () {
    it('should redirect to nfs url', function (done) {
      mm(Dist, 'getfile', function* () {
        return {
          name: 'foo.txt', size: 1024, date: '02-May-2014 00:54',
          url: 'http://mock.com/dist/v0.10.28/SHASUMS.txt'
        };
      });

      request(app)
      .get('/dist/v0.10.28/SHASUMS.txt')
      .expect(302)
      .expect('Location', 'http://mock.com/dist/v0.10.28/SHASUMS.txt', done);
    });

    it('should GET /dist/npm-versions.txt redirect to nfs url', function (done) {
      mm(Dist, 'getfile', function* (fullname) {
        fullname.should.equal('/npm-versions.txt');
        return {
          name: 'npm-versions.txt', size: 1024, date: '02-May-2014 00:54',
          url: 'http://mock.com/dist/npm-versions.txt'
        };
      });

      request(app)
      .get('/dist/npm-versions.txt')
      .expect(302)
      .expect('Location', 'http://mock.com/dist/npm-versions.txt', done);
    });

    it('should download nfs file and send it', function (done) {
      mm(Dist, 'getfile', function* () {
        return {
          name: 'foo.txt',
          size: 1264,
          date: '02-May-2014 00:54',
          url: '/dist/v0.10.28/SHASUMS.txt'
        };
      });

      request(app)
      .get('/dist/v0.10.28/SHASUMS.txt')
      .expect(200)
      .expect(/6eff580cc8460741155d42ef1ef537961194443f/, done);
    });
  });
});
