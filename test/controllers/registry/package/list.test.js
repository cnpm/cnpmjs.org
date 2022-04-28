'use strict';

var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mm = require('mm');
var pedding = require('pedding');
var packageService = require('../../../../services/package');
var blocklistService = require('../../../../services/blocklist');
var app = require('../../../../servers/registry');
var utils = require('../../../utils');
var config = require('../../../../config');

describe('test/controllers/registry/package/list.test.js', () => {
  afterEach(mm.restore);

  before(function (done) {
    done = pedding(2, done);
    utils.sync('baidu', done);

    var pkg = utils.getPackage('@cnpmtest/testmodule-list-1', '0.0.1', utils.otherUser);
    pkg.versions['0.0.1'].dependencies = {
      bytetest: '~0.0.1',
      mocha: '~1.0.0',
    };
    pkg.versions['0.0.1'].scripts = {
      install: 'node -v',
    };
    request(app)
    .put('/' + pkg.name)
    .set('authorization', utils.otherUserAuth)
    .send(pkg)
    .expect(201, function (err) {
      should.not.exist(err);
      var pkg = utils.getPackage('@cnpmtest/testmodule-list-1', '1.0.0', utils.otherUser);
      pkg.versions['1.0.0'].dependencies = {
        bytetest: '~0.0.1',
        mocha: '~1.0.0'
      };
      request(app)
      .put('/' + pkg.name)
      .set('authorization', utils.otherUserAuth)
      .send(pkg)
      .expect(201, done);
    });
  });

  describe('config.enableBugVersion = true / false', () => {
    before(done => {
      mm(config, 'syncModel', 'all');
      mm(config, 'enableAbbreviatedMetadata', true);
      utils.sync('base62', done);
    });

    before(function* () {
      let pkg = utils.getPackage('bug-versions', '1.0.0', utils.admin);
      const packageJSON = pkg.versions['1.0.0'];
      packageJSON.config = {};
      packageJSON.config['bug-versions'] = {
        "base62": {
          "1.2.5": {
            "version": "1.2.1",
            "reason": "ignore post-install script https://github.com/andrew/base62.js/commits/master"
          }
        },
        "request": {
          "2.84.0": {
            "version": "2.85.0",
            "reason": "https://github.com/cnpm/bug-versions/issues/3"
          }
        },
        "@cnpmtest/testmodule-list-bugversion": {
          "4.14.0": {
            "version": "4.13.2",
            "reason": "https://github.com/ali-sdk/ali-oss/pull/382"
          },
          "4.14.1": {
            "version": "4.13.2",
            "reason": "https://github.com/ali-sdk/ali-oss/pull/382"
          },
          "4.14.2": {
            "version": "1.0.0",
            "reason": "https://github.com/ali-sdk/ali-oss/pull/382"
          }
        }
      };
      yield request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.adminAuth)
        .send(pkg)
        .expect(201);

      pkg = utils.getPackage('@cnpmtest/testmodule-list-bugversion', '4.14.0', utils.otherUser);
      pkg.versions['4.14.0'].deprecated = 'mock deprecated exists here';
      yield request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.otherUserAuth)
        .send(pkg)
        .expect(201);
      pkg = utils.getPackage('@cnpmtest/testmodule-list-bugversion', '4.14.1', utils.otherUser);
      yield request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.otherUserAuth)
        .send(pkg)
        .expect(201);
      pkg = utils.getPackage('@cnpmtest/testmodule-list-bugversion', '4.14.2', utils.otherUser);
      yield request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.otherUserAuth)
        .send(pkg)
        .expect(201);
      pkg = utils.getPackage('@cnpmtest/testmodule-list-bugversion', '4.13.2', utils.otherUser);
      yield request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.otherUserAuth)
        .send(pkg)
        .expect(201);
    });

    it('should replace base62\'s bug version 1.2.5 to 1.2.1', function* () {
      mm(config, 'syncModel', 'all');
      mm(config, 'enableAbbreviatedMetadata', true);
      mm(config, 'enableBugVersion', true);
      mm(config.nfs, 'url', function* (key) {
        return 'http://foo.test.com' + key;
      });
      mm(config, 'downloadRedirectToNFS', true);
      // https://github.com/cnpm/bug-versions/blob/master/package.json#L201
      let res = yield request(app)
        .get('/base62')
        .expect(200);
      let data = res.body;
      assert(data.versions['1.2.5']);
      assert(data.versions['1.2.1']);
      assert(data.versions['1.2.5']);
      assert(data.versions['1.2.1']);
      assert(data.versions['1.2.5'].version === '1.2.5');
      assert(data.versions['1.2.5'].deprecated === '[WARNING] Use 1.2.1 instead of 1.2.5, reason: ignore post-install script https://github.com/andrew/base62.js/commits/master');
      assert(data.versions['1.2.5'].dist.tarball.endsWith('/base62-1.2.1.tgz'));
      // assert(!data.versions['1.2.1'].deprecated);

      res = yield request(app)
        .get('/base62')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect(200);
      data = res.body;
      assert(data.versions['1.2.5']);
      assert(data.versions['1.2.1']);
      assert(data.versions['1.2.5'].version === '1.2.5');
      assert(data.versions['1.2.5'].deprecated);
      assert(data.versions['1.2.5'].dist.tarball.endsWith('/base62-1.2.1.tgz'));
      // assert(!data.versions['1.2.1'].deprecated);

      // ignore when sync worker request
      res = yield request(app)
        .get('/base62?cache=0')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect(200);
      data = res.body;
      assert(data.versions['1.2.5']);
      assert(data.versions['1.2.1']);
      assert(data.versions['1.2.5'].version === '1.2.5');
      assert(data.versions['1.2.5'].dist.tarball.endsWith('/base62-1.2.5.tgz'));
      // assert(!data.versions['1.2.5'].deprecated);
      res = yield request(app)
        .get('/base62?cache=0')
        .expect(200);
      data = res.body;
      assert(data.versions['1.2.5']);
      assert(data.versions['1.2.1']);
      assert(data.versions['1.2.5'].version === '1.2.5');
      assert(data.versions['1.2.5'].dist.tarball.endsWith('/base62-1.2.5.tgz'));
      // assert(!data.versions['1.2.5'].deprecated);

      // dont change download url
      yield request(app)
        .get('/base62/download/base62-1.2.5.tgz')
        .expect('location', 'http://foo.test.com/base62/-/base62-1.2.5.tgz')
        .expect(302);

      // ignore when enableBugVersion = false
      mm(config, 'enableBugVersion', false);
      res = yield request(app)
        .get('/base62')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect(200);
      data = res.body;
      assert(data.versions['1.2.5']);
      assert(data.versions['1.2.1']);
      assert(data.versions['1.2.5'].version === '1.2.5');
      assert(data.versions['1.2.5'].dist.tarball.endsWith('/base62-1.2.5.tgz'));
      // assert(!data.versions['1.2.5'].deprecated);

      yield request(app)
        .get('/base62/download/base62-1.2.5.tgz')
        .expect('location', 'http://foo.test.com/base62/-/base62-1.2.5.tgz')
        .expect(302);
    });

    it('should replace @cnpmtest/testmodule-list-bugversion bug versions', function* () {
      mm(config, 'enableBugVersion', true);
      mm(config, 'enableAbbreviatedMetadata', true);
      mm(config.nfs, 'url', function* (key) {
        return 'http://foo.test.com' + key;
      });
      mm(config, 'downloadRedirectToNFS', true);
      // https://github.com/cnpm/bug-versions/blob/master/package.json#L201
      let res = yield request(app)
        .get('/@cnpmtest/testmodule-list-bugversion')
        .expect(200);
      let data = res.body;
      assert(data.versions['4.14.0']);
      assert(data.versions['4.14.1']);
      assert(data.versions['4.14.2']);
      assert(data.versions['4.13.2']);
      assert(data.versions['4.14.0'].version === '4.14.0');
      assert(data.versions['4.14.1'].version === '4.14.1');
      assert(data.versions['4.14.0'].deprecated === 'mock deprecated exists here ([WARNING] Use 4.13.2 instead of 4.14.0, reason: https://github.com/ali-sdk/ali-oss/pull/382)');
      assert(data.versions['4.14.1'].deprecated === '[WARNING] Use 4.13.2 instead of 4.14.1, reason: https://github.com/ali-sdk/ali-oss/pull/382');
      assert(data.versions['4.14.0'].dist.tarball.endsWith('/@cnpmtest/testmodule-list-bugversion-4.13.2.tgz'));
      assert(data.versions['4.14.1'].dist.tarball.endsWith('/@cnpmtest/testmodule-list-bugversion-4.13.2.tgz'));
      assert(data.versions['4.14.2'].dist.tarball.endsWith('/@cnpmtest/testmodule-list-bugversion-4.14.2.tgz'));
      // 4.14.2 replace bug version 1.0.0 dont exists, dont replace
      assert(!data.versions['4.14.2'].deprecated);
      assert(!data.versions['4.13.2'].deprecated);

      // dont change download url
      yield request(app)
        .get('/@cnpmtest/testmodule-list-bugversion/download/@cnpmtest/testmodule-list-bugversion-4.14.0.tgz')
        .expect('location', 'http://foo.test.com/@cnpmtest/testmodule-list-bugversion/-/@cnpmtest/testmodule-list-bugversion-4.14.0.tgz')
        .expect(302);

      res = yield request(app)
        .get('/@cnpmtest/testmodule-list-bugversion')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect(200);
      data = res.body;
      assert(data.versions['4.14.0']);
      assert(data.versions['4.14.1']);
      assert(data.versions['4.14.2']);
      assert(data.versions['4.13.2']);
      assert(data.versions['4.14.0'].version === '4.14.0');
      assert(data.versions['4.14.1'].version === '4.14.1');
      assert(data.versions['4.14.0'].deprecated === 'mock deprecated exists here ([WARNING] Use 4.13.2 instead of 4.14.0, reason: https://github.com/ali-sdk/ali-oss/pull/382)');
      assert(data.versions['4.14.1'].deprecated === '[WARNING] Use 4.13.2 instead of 4.14.1, reason: https://github.com/ali-sdk/ali-oss/pull/382');
      assert(data.versions['4.14.0'].dist.tarball.endsWith('/@cnpmtest/testmodule-list-bugversion-4.13.2.tgz'));
      assert(data.versions['4.14.1'].dist.tarball.endsWith('/@cnpmtest/testmodule-list-bugversion-4.13.2.tgz'));
      assert(data.versions['4.14.2'].dist.tarball.endsWith('/@cnpmtest/testmodule-list-bugversion-4.14.2.tgz'));
      // 4.14.2 replace bug version 1.0.0 dont exists, dont replace
      assert(!data.versions['4.14.2'].deprecated);
      assert(!data.versions['4.13.2'].deprecated);

      // ignore when sync worker request
      res = yield request(app)
        .get('/@cnpmtest/testmodule-list-bugversion?cache=0')
        .expect(200);
      data = res.body;
      assert(data.versions['4.14.0']);
      assert(data.versions['4.14.1']);
      assert(data.versions['4.14.2']);
      assert(data.versions['4.13.2']);
      assert(data.versions['4.14.0'].version === '4.14.0');
      assert(data.versions['4.14.1'].version === '4.14.1');
      assert(data.versions['4.14.0'].deprecated === 'mock deprecated exists here');
      assert(!data.versions['4.14.1'].deprecated);
      assert(!data.versions['4.14.2'].deprecated);
      assert(!data.versions['4.13.2'].deprecated);
      res = yield request(app)
        .get('/@cnpmtest/testmodule-list-bugversion?cache=0')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect(200);
      data = res.body;
      assert(data.versions['4.14.0']);
      assert(data.versions['4.14.1']);
      assert(data.versions['4.14.2']);
      assert(data.versions['4.13.2']);
      assert(data.versions['4.14.0'].version === '4.14.0');
      assert(data.versions['4.14.1'].version === '4.14.1');
      assert(data.versions['4.14.0'].deprecated === 'mock deprecated exists here');
      assert(!data.versions['4.14.1'].deprecated);
      assert(!data.versions['4.14.2'].deprecated);
      assert(!data.versions['4.13.2'].deprecated);

      // ignore when enableBugVersion = false
      mm(config, 'enableBugVersion', false);
      res = yield request(app)
        .get('/@cnpmtest/testmodule-list-bugversion')
        .expect(200);
      data = res.body;
      assert(data.versions['4.14.0']);
      assert(data.versions['4.14.1']);
      assert(data.versions['4.14.2']);
      assert(data.versions['4.13.2']);
      assert(data.versions['4.14.0'].version === '4.14.0');
      assert(data.versions['4.14.1'].version === '4.14.1');
      assert(data.versions['4.14.0'].deprecated === 'mock deprecated exists here');
      assert(!data.versions['4.14.1'].deprecated);
      assert(!data.versions['4.14.2'].deprecated);
      assert(!data.versions['4.13.2'].deprecated);

      res = yield request(app)
        .get('/@cnpmtest/testmodule-list-bugversion')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect(200);
      data = res.body;
      assert(data.versions['4.14.0']);
      assert(data.versions['4.14.1']);
      assert(data.versions['4.14.2']);
      assert(data.versions['4.13.2']);
      assert(data.versions['4.14.0'].version === '4.14.0');
      assert(data.versions['4.14.1'].version === '4.14.1');
      assert(data.versions['4.14.0'].deprecated === 'mock deprecated exists here');
      assert(data.versions['4.14.0'].dist.tarball.endsWith('/@cnpmtest/testmodule-list-bugversion-4.14.0.tgz'));
      assert(data.versions['4.14.1'].dist.tarball.endsWith('/@cnpmtest/testmodule-list-bugversion-4.14.1.tgz'));
      assert(data.versions['4.14.2'].dist.tarball.endsWith('/@cnpmtest/testmodule-list-bugversion-4.14.2.tgz'));
      assert(!data.versions['4.14.1'].deprecated);
      assert(!data.versions['4.14.2'].deprecated);
      assert(!data.versions['4.13.2'].deprecated);
    });
  });

  describe('block versions', () => {
    before(function* () {
      var pkg = utils.getPackage('@cnpmtest/testmodule-list-block', '0.0.1', utils.otherUser);
      pkg.versions['0.0.1'].dependencies = {
        bytetest: '~0.0.1',
        mocha: '~1.0.0',
      };
      pkg.versions['0.0.1'].scripts = {
        install: 'node -v',
      };
      yield request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.otherUserAuth)
        .send(pkg)
        .expect(201);
      
      pkg = utils.getPackage('@cnpmtest/testmodule-list-block', '1.0.0', utils.otherUser);
      pkg.versions['1.0.0'].dependencies = {
        bytetest: '~0.0.1',
        mocha: '~1.0.0'
      };
      yield request(app)
        .put('/' + pkg.name)
        .set('authorization', utils.otherUserAuth)
        .send(pkg)
        .expect(201);
    });

    it('should block one version and all versions', function* () {
      yield blocklistService.blockPackageVersion('@cnpmtest/testmodule-list-block', '0.0.1', 'unittest');
      let res = yield request(app)
        .get('/@cnpmtest/testmodule-list-block')
        .expect(200);
      let data = res.body;
      assert(Object.keys(data.versions).length === 1);
      assert(data.versions['1.0.0']);
      assert(!data.versions['0.0.1']);

      res = yield request(app)
        .get('/@cnpmtest/testmodule-list-block')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect(200);
      data = res.body;
      assert(Object.keys(data.versions).length === 1);
      assert(data.versions['1.0.0']);
      assert(!data.versions['0.0.1']);

      yield blocklistService.blockPackageVersion('@cnpmtest/testmodule-list-block', '*', 'unittest');
      res = yield request(app)
        .get('/@cnpmtest/testmodule-list-block')
        .expect(451);
      data = res.body;
      console.log(data);
      assert(data.error === '[block] package was blocked, reason: unittest');
    });
  });

  it('should use costomized registry middleware', done => {
    request(app)
    .get('/@cnpmtest/testmodule-list-1')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-list-1');
      assert(res.headers['x-custom-middleware'] === 'true');
      assert(res.headers['x-custom-app-models'] === 'true');
      done();
    });
  });

  it('should return all versions', done => {
    request(app)
    .get('/@cnpmtest/testmodule-list-1')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-list-1');
      Object.keys(data.versions).should.eql(['1.0.0', '0.0.1']);
      for (const v in data.versions) {
        const pkg = data.versions[v];
        assert(pkg.publish_time && typeof pkg.publish_time === 'number');
      }
      assert(/^W\/"\w{32}"$/.test(res.headers.etag));

      // should 304
      request(app)
      .get('/@cnpmtest/testmodule-list-1')
      .set('If-None-Match', res.headers.etag)
      .expect(304, done);
    });
  });

  it('should return all versions with cache-control', done => {
    mm(config, 'registryCacheControlHeader', 'max-age=0, s-maxage=10, must-revalidate');
    mm(config, 'registryVaryHeader', 'accept, accept-Encoding');
    request(app)
    .get('/@cnpmtest/testmodule-list-1')
    .expect('cache-control', 'max-age=0, s-maxage=10, must-revalidate')
    .expect('vary', 'accept, accept-Encoding')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-list-1');
      Object.keys(data.versions).should.eql(['1.0.0', '0.0.1']);
      for (const v in data.versions) {
        const pkg = data.versions[v];
        assert(pkg.publish_time && typeof pkg.publish_time === 'number');
      }
      assert(/^W\/"\w{32}"$/.test(res.headers.etag));

      // should 304
      request(app)
      .get('/@cnpmtest/testmodule-list-1')
      .set('If-None-Match', res.headers.etag)
      .expect(304, done);
    });
  });

  it('should return all versions in abbreviated meta format for private scope package', function(done) {
    mm(config, 'registryCacheControlHeader', 'max-age=0, s-maxage=10, must-revalidate');
    request(app)
    .get('/@cnpmtest/testmodule-list-1')
    .set('Accept', 'application/vnd.npm.install-v1+json')
    .expect('cache-control', 'max-age=0, s-maxage=10, must-revalidate')
    .expect(200, function(err, res) {
      should.not.exist(err);
      var data = res.body;
      assert(data.name === '@cnpmtest/testmodule-list-1');
      assert.deepEqual(Object.keys(data.versions), ['1.0.0', '0.0.1']);
      assert(data.modified);
      assert.deepEqual(data['dist-tags'], { latest: '1.0.0' });
      assert(!data.time);
      assert(/^W\/"\w{32}"$/.test(res.headers.etag));

      // should 304
      request(app)
      .get('/@cnpmtest/testmodule-list-1')
      .set('Accept', 'application/vnd.npm.install-v1+json')
      .set('If-None-Match', res.headers.etag)
      .expect(304, done);
    });
  });

  it('should return abbreviated meta when Accept: application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*', () => {
    return request(app)
      .get('/@cnpmtest/testmodule-list-1')
      .set('Accept', 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*')
      .expect(res => {
        var data = res.body;
        assert(data.name === '@cnpmtest/testmodule-list-1');
        assert.deepEqual(Object.keys(data.versions), ['1.0.0', '0.0.1']);
        assert(data.modified);
        assert.deepEqual(data['dist-tags'], { latest: '1.0.0' });
        assert(!data.time);
        assert(/^W\/"\w{32}"$/.test(res.headers.etag));
      })
      .expect(200);
  });

  it('should return abbreviated meta with cache-controll', () => {
    mm(config, 'registryCacheControlHeader', 'max-age=0, s-maxage=10, must-revalidate');
    return request(app)
      .get('/@cnpmtest/testmodule-list-1')
      .set('Accept', 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*')
      .expect('cache-control', 'max-age=0, s-maxage=10, must-revalidate')
      .expect(res => {
        var data = res.body;
        assert(data.name === '@cnpmtest/testmodule-list-1');
        assert.deepEqual(Object.keys(data.versions), ['1.0.0', '0.0.1']);
        assert(data.modified);
        assert.deepEqual(data['dist-tags'], { latest: '1.0.0' });
        assert(!data.time);
        assert(/^W\/"\w{32}"$/.test(res.headers.etag));
      })
      .expect(200);
  });

  it('should show star users', function (done) {
    mm(packageService, 'listStarUserNames', function* () {
      return ['fengmk2', 'foouser'];
    });
    request(app)
    .get('/@cnpmtest/testmodule-list-1')
    .expect(200, function (err, res) {
      should.not.exist(err);
      var data = res.body;
      data.name.should.equal('@cnpmtest/testmodule-list-1');
      data.users.should.eql({
        fengmk2: true,
        foouser: true
      });
      data.versions['0.0.1'].publish_time.should.equal(data.versions['0.0.1']._cnpm_publish_time);
      assert(/^W\/"\w{32}"$/.test(res.headers.etag));
      done();
    });
  });

  it('should support jsonp', function (done) {
    request(app)
    .get('/@cnpmtest/testmodule-list-1?callback=jsonp')
    .expect(/jsonp\(\{/)
    .expect(res => {
      assert(/^W\/"\w{32}"$/.test(res.headers.etag));
    })
    .expect(200, done);
  });

  it('should 404 when package not exists', function (done) {
    request(app)
    .get('/@cnpmtest/not-exists-package')
    .expect(404)
    .expect({
      error: '[not_found] document not found',
      reason: '[not_found] document not found',
    }, done);
  });

  it('should not sync not-exists package when config.syncByInstall = false', function (done) {
    mm(config, 'syncByInstall', false);
    request(app)
    .get('/@cnpmtest/not-exists-package')
    .expect(404)
    .expect({
      error: '[not_found] document not found',
      reason: '[not_found] document not found',
    }, done);
  });

  it('should sync not-exists package when config.syncByInstall = true', function (done) {
    mm(config, 'syncByInstall', true);
    request(app)
    .get('/should')
    .expect(302, done);
  });

  it('should not sync not-exists scoped package', function (done) {
    mm(config, 'syncByInstall', true);
    request(app)
    .get('/@cnpmtest/pedding')
    .expect(404)
    .expect({
      error: '[not_found] document not found',
      reason: '[not_found] document not found',
    }, done);
  });

  it('should config.formatCustomFullPackageInfoAndVersions work', async () => {
    mm(config, 'formatCustomFullPackageInfoAndVersions', (ctx, info) => {
      console.log('%s %s, query: %j', ctx.method, ctx.url, ctx.query);
      info.description = '';
      info.readme = '';
      for (const version in info.versions) {
        const item = info.versions[version];
        item.description = '';
        item.readme = '';
      }
      return info;
    });
    const res = await request(app)
      .get('/@cnpmtest/testmodule-list-1?a=123123');
    assert(res.status === 200);
    assert(res.body.description === '');
    assert(res.body.readme === '');
    const firstVersion = Object.keys(res.body.versions)[0];
    assert(firstVersion);
    assert(res.body.versions[firstVersion].description === '');
    assert(res.body.versions[firstVersion].readme === '');
  });

  describe.skip('unpublished', () => {
    before(done => {
      mm(config, 'syncModel', 'all');
      utils.sync('moduletest1', done);
    });

    it('should show unpublished info', done => {
      mm(config, 'syncModel', 'all');
      request(app)
      .get('/moduletest1')
      .expect(404, function (err, res) {
        should.not.exist(err);
        var data = res.body;
        data.time.unpublished.name.should.equal('dead_horse');
        done();
      });
    });
  });

  describe('npm package', function () {
    before(function (done) {
      utils.sync('tair', done);
    });

    it('should show npm package after sync', function (done) {
      mm(config, 'syncModel', 'all');
      request(app)
      .get('/tair')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var data = res.body;
        assert(data.name === 'tair');
        assert(data.maintainers);
        done();
      });
    });
  });

  describe('add tag', function () {
    var tagModified;
    before(function (done) {
      request(app)
      .put('/@cnpmtest/testmodule-list-1/test-tag')
      .set('content-type', 'application/json')
      .set('authorization', utils.adminAuth)
      .send(JSON.stringify('0.0.1'))
      .expect(201, function (err, res) {
        should.not.exist(err);
        res.body.ok.should.equal(true);
        tagModified = res.body.modified;
        done();
      });
    });

    it('should use tag gmt_modified', function (done) {
      request(app)
      .get('/@cnpmtest/testmodule-list-1')
      .expect(200, function (err, res) {
        should.not.exist(err);
        var data = res.body;
        data.name.should.equal('@cnpmtest/testmodule-list-1');
        data.time.modified.should.equal(tagModified);
        done();
      });
    });
  });

  describe('list AbbreviatedMeta', () => {
    before(done => {
      // mm(config, 'sourceNpmRegistry', config.officialNpmRegistry);
      mm(config, 'syncModel', 'all');
      mm(config, 'enableAbbreviatedMetadata', true);
      utils.sync('pedding', done);
    });

    it('should return abbreviated meta when Accept: application/vnd.npm.install-v1+json', () => {
      mm(config, 'syncModel', 'all');
      mm(config, 'enableAbbreviatedMetadata', true);
      return request(app)
        .get('/pedding')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect(200)
        .expect(res => {
          const data = res.body;
          assert(data.name === 'pedding');
          assert(data.modified);
          assert(data['dist-tags'].latest);
          assert(Object.keys(data.versions).length > 0);
          for (const v in data.versions) {
            const pkg = data.versions[v];
            // assert('_hasShrinkwrap' in pkg);
            assert(pkg.publish_time && typeof pkg.publish_time === 'number');
            assert(pkg._publish_on_cnpm === undefined);
          }
          assert(/^W\/"\w{32}"$/.test(res.headers.etag));
        });
    });

    it('should return abbreviated meta on private package and has hasInstallScript field', () => {
      mm(config, 'enableAbbreviatedMetadata', true);
      return request(app)
        .get('/@cnpmtest/testmodule-list-1')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect(200)
        .expect(res => {
          const data = res.body;
          // console.log(JSON.stringify(data, null, 2));
          assert(data.name === '@cnpmtest/testmodule-list-1');
          assert(data.modified);
          assert(data['dist-tags'].latest);
          assert(data.versions['0.0.1'].hasInstallScript === true);
          assert(data.versions['0.0.1'].scripts === undefined);
        });
    });

    it('should return abbreviated meta with cache-control', () => {
      mm(config, 'registryCacheControlHeader', 'max-age=0, s-maxage=10, must-revalidate');
      mm(config, 'syncModel', 'all');
      mm(config, 'enableAbbreviatedMetadata', true);
      return request(app)
        .get('/pedding')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect('cache-control', 'max-age=0, s-maxage=10, must-revalidate')
        .expect(200)
        .expect(res => {
          const data = res.body;
          assert(data.name === 'pedding');
          assert(data.modified);
          assert(data['dist-tags'].latest);
          assert(Object.keys(data.versions).length > 0);
          for (const v in data.versions) {
            const pkg = data.versions[v];
            // assert('_hasShrinkwrap' in pkg);
            assert(pkg.publish_time && typeof pkg.publish_time === 'number');
            assert(pkg._publish_on_cnpm === undefined);
          }
          assert(/^W\/"\w{32}"$/.test(res.headers.etag));
        });
    });

    it('should 404 when package not exists', () => {
      mm(config, 'syncModel', 'all');
      mm(config, 'enableAbbreviatedMetadata', true);
      return request(app)
        .get('/@cnpmtest/not-exists-package')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect(404)
        .expect({
          error: '[not_found] document not found',
          reason: '[not_found] document not found',
        });
    });

    it('should return full meta when enableAbbreviatedMetadata is false and Accept is application/vnd.npm.install-v1+json', () => {
      mm(config, 'syncModel', 'all');
      mm(config, 'enableAbbreviatedMetadata', false);
      return request(app)
        .get('/pedding')
        .set('Accept', 'application/vnd.npm.install-v1+json')
        .expect(200)
        .expect(res => {
          const data = res.body;
          assert(data.name === 'pedding');
          assert(data.description);
          assert(data.maintainers);
          // assert(data.readme);
          assert(data['dist-tags'].latest);
          assert(Object.keys(data.versions).length > 0);
          for (const v in data.versions) {
            const pkg = data.versions[v];
            // assert('_hasShrinkwrap' in pkg);
            assert(pkg.publish_time && typeof pkg.publish_time === 'number');
            assert(pkg._publish_on_cnpm === undefined);
          }
          assert(/^W\/"\w{32}"$/.test(res.headers.etag));
        });
    });

    it('should return full meta when Accept is not application/vnd.npm.install-v1+json', () => {
      mm(config, 'syncModel', 'all');
      mm(config, 'enableAbbreviatedMetadata', true);
      return request(app)
        .get('/pedding?bucket=foo-us1&admin=1')
        .set('Accept', 'application/json')
        .expect(200)
        .expect(res => {
          const data = res.body;
          assert(data.name === 'pedding');
          assert(data.description);
          assert(data.readme);
          assert(data.maintainers);
          assert(data['dist-tags'].latest);
          assert(Object.keys(data.versions).length > 0);
          for (const v in data.versions) {
            const pkg = data.versions[v];
            // assert('_hasShrinkwrap' in pkg);
            assert(pkg.publish_time && typeof pkg.publish_time === 'number');
            assert(pkg._publish_on_cnpm === undefined);
            assert(pkg.dist.tarball.endsWith('.tgz'));
          }
          assert(/^W\/"\w{32}"$/.test(res.headers.etag));
        });
    });
  });
});
