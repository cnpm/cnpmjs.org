'use strict';

const assert = require('assert');
const request = require('supertest');
const mm = require('mm');
const config = require('../../../../config');
const app = require('../../../../servers/web');
const registry = require('../../../../servers/registry');
const utils = require('../../../utils');

describe('test/controllers/web/package/show.test.js', () => {
  before(() => {
    const pkg = utils.getPackage('@cnpmtest/testmodule-web-show', '0.0.1', utils.admin);
    pkg.versions['0.0.1'].dependencies = {
      bytetest: '~0.0.1',
      mocha: '~1.0.0',
      'testmodule-web-show': '0.0.1',
    };

    return request(registry.listen())
      .put('/' + pkg.name)
      .set('authorization', utils.adminAuth)
      .send(pkg)
      .expect(201);
  });

  afterEach(mm.restore);

  describe('GET /package/:name', () => {
    it('should get 200', () => {
      return request(app.listen())
        .get('/package/@cnpmtest/testmodule-web-show')
        .expect(200)
        .expect('content-type', 'text/html; charset=utf-8')
        .expect(/testmodule-web-show/)
        .expect(/Maintainers/)
        .expect(/Dependencies/)
        .expect(/Downloads/, (err, res) => {
          assert(!err);
          assert(res.headers.etag);
          assert(res.text.includes('<meta charset="utf-8">'));
        });
    });

    it('should get scoped package', () => {
      return request(app.listen())
        .get('/package/@cnpmtest/testmodule-web-show')
        .expect(200)
        .expect('content-type', 'text/html; charset=utf-8')
        .expect(/testmodule-web-show/)
        .expect(/Maintainers/)
        .expect(/Dependencies/)
        .expect(/Downloads/, (err, res) => {
          assert(!err);
          assert(res.headers.etag);
          assert(res.text.includes('<meta charset="utf-8">'));
        });
    });

    it('should get 404', () => {
      return request(app)
        .get('/package/@cnpmtest/not-exist-module')
        .expect(404);
    });
  });

  describe('GET /package/:name/:version', () => {
    it('should 200 when get by version', () => {
      return request(app)
        .get('/package/@cnpmtest/testmodule-web-show/0.0.1')
        .expect(200)
        .expect(/testmodule-web-show/)
        .expect(/Maintainers/)
        .expect(/Dependencies/)
        .expect(/Downloads/);
    });

    it('should 200 when get by tag', () => {
      return request(app)
        .get('/package/@cnpmtest/testmodule-web-show/latest')
        .expect(200)
        .expect(/testmodule-web-show/)
        .expect(/Maintainers/)
        .expect(/Dependencies/)
        .expect(/Downloads/);
    });

    it('should 404 when get by version not exist', () => {
      return request(app)
        .get('/package/@cnpmtest/testmodule-web-show/1.1.2')
        .expect(404);
    });

    it('should 404 when get by tag', () => {
      return request(app)
        .get('/package/@cnpmtest/testmodule-web-show/notexisttag')
        .expect(404);
    });
  });

  describe.skip('unpublished package', () => {
    before(done => {
      mm(config, 'syncModel', 'all');
      utils.sync('mk2testmodule', done);
    });

    it('should display unpublished info', () => {
      mm(config, 'syncModel', 'all');
      return request(app)
        .get('/package/mk2testmodule')
        .expect(200)
        .expect(/This package has been unpublished\./);
    });
  });

  describe('xss filter', () => {
    before(() => {
      const pkg = utils.getPackage('@cnpmtest/xss-test-ut', '0.0.1', utils.admin,
        null, '[xss link](javascript:alert(2)) \n\nfoo<script>alert(1)</script>/xss\'"&#');
      return request(registry.listen())
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201);
    });

    it('should filter xss content', () => {
      return request(app.listen())
        .get('/package/@cnpmtest/xss-test-ut')
        .expect(200, (err, res) => {
          assert(!err);
          assert(!res.text.includes('<script>alert(1)</script>'));
          assert(!res.text.includes('alert(2)"'));
        });
    });
  });

  describe('show npm package', () => {
    before(done => {
      mm(config, 'syncModel', 'exists');
      utils.sync('pedding', done);
    });

    it('should show pedding package info and contributors', () => {
      mm(config, 'syncModel', 'exists');
      return request(app)
        .get('/package/pedding')
        .expect(200)
        // https://github.com/cnpm/cnpmjs.org/issues/497
        .expect(/by <a href="\/\~fengmk2">fengmk2<\/a>/)
        // snyk link
        .expect(/<a class="badge-link" href="https:\/\/snyk\.io\/test\/npm\/pedding" target="_blank"><img title="Known Vulnerabilities" src="https:\/\/snyk\.io\/test\/npm\/pedding\/badge\.svg\?style=flat-square"><\/a>/)
        .expect(/pedding/);
    });
  });

  describe('show repository url in git syntax', () => {
    before(() => {
      const pkg = utils.getPackage('@cnpmtest/testmodule-repo-git', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].repository = {
        type: 'git',
        url: 'git://github.com/cnpm/cnpmjs.org.git',
      };
      return request(registry.listen())
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201);
    });

    it('should get 200', () => {
      return request(app.listen())
        .get('/package/@cnpmtest/testmodule-repo-git')
        .expect(200)
        .expect('content-type', 'text/html; charset=utf-8')
        .expect(/testmodule-repo-git/)
        .expect(/Maintainers/)
        .expect(/Dependencies/)
        .expect(/https:\/\/github\.com\/cnpm\/cnpmjs\.org/)
        .expect(/Downloads/, (err, res) => {
          assert(!err);
          assert(res.headers.etag);
          assert(res.text.includes('<meta charset="utf-8">'));
        });
    });
  });

  describe('show repository url in ssh syntax', () => {
    before(() => {
      const pkg = utils.getPackage('@cnpmtest/testmodule-repo-ssh', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].repository = {
        type: 'git',
        url: 'git@github.com:cnpm/cnpmjs.org.git',
      };
      return request(registry.listen())
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201);
    });

    it('should get 200', () => {
      return request(app.listen())
        .get('/package/@cnpmtest/testmodule-repo-ssh')
        .expect(200)
        .expect('content-type', 'text/html; charset=utf-8')
        .expect(/testmodule-repo-ssh/)
        .expect(/Maintainers/)
        .expect(/Dependencies/)
        .expect(/https:\/\/github\.com\/cnpm\/cnpmjs\.org/)
        .expect(/Downloads/, (err, res) => {
          assert(!err);
          assert(res.headers.etag);
          assert(res.text.includes('<meta charset="utf-8">'));
        });
    });
  });

  describe('show repository url in raw ssh syntax', () => {
    before(() => {
      const pkg = utils.getPackage('@cnpmtest/testmodule-repo-raw-ssh', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].repository = {
        type: 'git',
        url: 'ssh://git@github.com/cnpm/cnpmjs.org.git',
      };
      return request(registry.listen())
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201);
    });

    it('should get 200', () => {
      return request(app.listen())
        .get('/package/@cnpmtest/testmodule-repo-raw-ssh')
        .expect(200)
        .expect('content-type', 'text/html; charset=utf-8')
        .expect(/testmodule-repo-raw-ssh/)
        .expect(/Maintainers/)
        .expect(/Dependencies/)
        .expect(/https:\/\/github\.com\/cnpm\/cnpmjs\.org/)
        .expect(/Downloads/, (err, res) => {
          assert(!err);
          assert(res.headers.etag);
          assert(res.text.includes('<meta charset="utf-8">'));
        });
    });
  });

  describe('show repository url in https syntax', () => {
    before(() => {
      const pkg = utils.getPackage('@cnpmtest/testmodule-repo-https', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].repository = {
        type: 'git',
        url: 'https://github.com/cnpm/cnpmjs.org.git',
      };
      return request(registry.listen())
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201);
    });

    it('should get 200', () => {
      return request(app.listen())
        .get('/package/@cnpmtest/testmodule-repo-https')
        .expect(200)
        .expect('content-type', 'text/html; charset=utf-8')
        .expect(/testmodule-repo-https/)
        .expect(/Maintainers/)
        .expect(/Dependencies/)
        .expect(/https:\/\/github\.com\/cnpm\/cnpmjs\.org\.git/)
        .expect(/Downloads/, (err, res) => {
          assert(!err);
          assert(res.headers.etag);
          assert(res.text.includes('<meta charset="utf-8">'));
        });
    });
  });

  describe('show repository url in short https syntax', () => {
    before(() => {
      const pkg = utils.getPackage('@cnpmtest/testmodule-repo-short-https', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].repository = {
        type: 'git',
        url: 'https://github.com/cnpm/cnpmjs.org',
      };
      return request(registry.listen())
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201);
    });

    it('should get 200', () => {
      return request(app.listen())
        .get('/package/@cnpmtest/testmodule-repo-short-https')
        .expect(200)
        .expect('content-type', 'text/html; charset=utf-8')
        .expect(/testmodule-repo-short-https/)
        .expect(/Maintainers/)
        .expect(/Dependencies/)
        .expect(/https:\/\/github\.com\/cnpm\/cnpmjs\.org/)
        .expect(/Downloads/, (err, res) => {
          assert(!err);
          assert(res.headers.etag);
          assert(res.text.includes('<meta charset="utf-8">'));
        });
    });
  });

  describe('show repository url in short http syntax', () => {
    before(() => {
      const pkg = utils.getPackage('@cnpmtest/testmodule-repo-short-http', '0.0.1', utils.admin);
      pkg.versions['0.0.1'].repository = {
        type: 'git',
        url: 'http://github.com/cnpm/cnpmjs.org.git',
      };
      return request(registry.listen())
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201);
    });

    it('should get 200', () => {
      return request(app.listen())
        .get('/package/@cnpmtest/testmodule-repo-short-http')
        .expect(200)
        .expect('content-type', 'text/html; charset=utf-8')
        .expect(/testmodule-repo-short-http/)
        .expect(/Maintainers/)
        .expect(/Dependencies/)
        .expect(/http:\/\/github\.com\/cnpm\/cnpmjs\.org/)
        .expect(/Downloads/, (err, res) => {
          assert(!err);
          assert(res.headers.etag);
          assert(res.text.includes('<meta charset="utf-8">'));
        });
    });
  });
});
