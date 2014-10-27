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
var mm = require('mm');
var fs = require('fs');
var nfs = require('../../../common/nfs');
var app = require('../../../servers/web');

describe('controllers/web/dist.test.js', function () {
  before(function (done) {
    app = app.listen(0, done);
  });

  afterEach(mm.restore);

  describe('GET /dist/*', function () {
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
        res.text.should.containEql('<title>Mirror index of http://nodejs.org/dist/</title>');
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
        res.text.should.containEql('<title>Mirror index of http://nodejs.org/dist/v1.0.0/</title>');
        res.text.should.containEql('<h1>Mirror index of <a target="_blank" href="http://nodejs.org/dist/v1.0.0/">http://nodejs.org/dist/v1.0.0/</a></h1>');
        res.text.should.containEql('<a href="ooxx/">ooxx/</a>                                             02-May-2014 00:54                   -\n');
        res.text.should.containEql('<a href="foo.txt">foo.txt</a>                                           02-May-2014 00:54                1024\n');
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
        res.text.should.containEql('<title>Mirror index of http://nodejs.org/dist/</title>');
        res.text.should.containEql('<h1>Mirror index of <a target="_blank" href="http://nodejs.org/dist/">http://nodejs.org/dist/</a></h1>');
        res.text.should.containEql('<a href="npm/">npm/</a>                                              02-May-2014 00:54                   -\n');
        res.text.should.containEql('<a href="npm-versions.txt">npm-versions.txt</a>                                  02-May-2014 00:54                1676\n');
        done();
      });
    });
  });

  describe('GET /dist/ files', function () {
    it('should pipe txt', function (done) {
      mm(Dist, 'getfile', function* () {
        return {
          name: 'foo.txt', size: 1024, date: '02-May-2014 00:54',
          url: 'http://mock.com/dist/v0.10.28/SHASUMS.txt'
        };
      });
      fs.writeFileSync(nfs._getpath('/dist/v0.10.28/SHASUMS.txt'), '6eff580cc8460741155d42ef1ef537961194443f');

      request(app)
      .get('/dist/v0.10.28/SHASUMS.txt')
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .expect(200, function (err, res) {
        should.not.exist(err);
        should.not.exist(res.headers['Content-Disposition']);
        done();
      });
    });

    it('should pipe html', function (done) {
      mm(Dist, 'getfile', function* () {
        return {
          name: 'foo.html', size: 1024, date: '02-May-2014 00:54',
          url: 'http://mock.com/dist/v0.10.28/foo.html'
        };
      });
      fs.writeFileSync(nfs._getpath('/dist/v0.10.28/foo.html'), '<p>hi</p>');

      request(app)
      .get('/dist/v0.10.28/foo.html')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect('<p>hi</p>')
      .expect(200, function (err, res) {
        should.not.exist(err);
        should.not.exist(res.headers['Content-Disposition']);
        done();
      });
    });

    it('should pipe json', function (done) {
      mm(Dist, 'getfile', function* () {
        return {
          name: 'foo.json', date: '02-May-2014 00:54',
          url: 'http://mock.com/dist/v0.10.28/foo.json'
        };
      });
      fs.writeFileSync(nfs._getpath('/dist/v0.10.28/foo.json'), '{}');

      request(app)
      .get('/dist/v0.10.28/foo.json')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect('{}')
      .expect(200, function (err, res) {
        should.not.exist(err);
        should.not.exist(res.headers['Content-Disposition']);
        done();
      });
    });

    it('should GET /dist/npm-versions.tgz redirect to nfs url', function (done) {
      mm(Dist, 'getfile', function* (fullname) {
        fullname.should.equal('/npm-versions.tgz');
        return {
          name: 'npm-versions.txt', size: 1024, date: '02-May-2014 00:54',
          url: 'http://mock.com/dist/npm-versions.tgz'
        };
      });

      request(app)
      .get('/dist/npm-versions.tgz')
      .expect(302)
      .expect('Location', 'http://mock.com/dist/npm-versions.tgz', done);
    });

    it('should download nfs txt file and send it', function (done) {
      mm(Dist, 'getfile', function* () {
        return {
          name: 'foo.txt',
          size: 1264,
          date: '02-May-2014 00:54',
          url: '/dist/v0.10.28/SHASUMS.txt'
        };
      });
      fs.writeFileSync(nfs._getpath('/dist/v0.10.28/SHASUMS.txt'), '6eff580cc8460741155d42ef1ef537961194443f');
      request(app)
      .get('/dist/v0.10.28/SHASUMS.txt')
      .expect(200)
      .expect(/6eff580cc8460741155d42ef1ef537961194443f/, done);
    });

    it('should download nfs tgz file and send it', function (done) {
      mm(Dist, 'getfile', function* () {
        return {
          name: 'foo.tgz',
          size: 1264,
          date: '02-May-2014 00:54',
          url: '/dist/v0.10.28/foo.tgz'
        };
      });
      fs.writeFileSync(nfs._getpath('/dist/v0.10.28/foo.tgz'), '6eff580cc8460741155d42ef1ef537961194443f');
      request(app)
      .get('/dist/v0.10.28/foo.tgz')
      .expect('Content-Disposition', 'attachment; filename="foo.tgz"')
      .expect(200, done);
    });

    it.skip('should download nfs no-ascii attachment file name', function (done) {
      mm(Dist, 'getfile', function* () {
        return {
          name: '中文名.tgz',
          size: 1264,
          date: '02-May-2014 00:54',
          url: '/dist/v0.10.28/foo.tgz'
        };
      });
      fs.writeFileSync(nfs._getpath('/dist/v0.10.28/foo.tgz'), '6eff580cc8460741155d42ef1ef537961194443f');
      request(app)
      .get('/dist/v0.10.28/foo.tgz')
      .expect('Content-Disposition', 'attachment; filename="%E4%B8%AD%E6%96%87%E5%90%8D.tgz"')
      .expect(200, done);
    });
  });
});
