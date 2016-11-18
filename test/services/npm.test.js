'use strict';

var should = require('should');
var mm = require('mm');
var fs = require('fs');
var path = require('path');
var ChunkStream = require('chunkstream');
var config = require('../../config');
var npm = require('../../services/npm');

var fixtures = path.join(path.dirname(__dirname), 'fixtures');

describe('services/npm.test.js', () => {
  afterEach(mm.restore);

  it('should return a module info from source npm', function* () {
    var data = yield npm.get('pedding');
    data.name.should.equal('pedding');
  });

  it('should return null when module not exist', function *() {
    var data = yield npm.get('pedding-not-exists');
    should.not.exist(data);
  });

  it.skip('should return error when http error', function* () {
    mm.http.request(/\//, new ChunkStream(['{']));
    try {
      yield npm.get('pedding-not-exists');
      throw new Error('should not run this');
    } catch (err) {
      err.name.should.equal('JSONResponseFormatError');
    }
  });

  it('should return ServerError when http 500 response', function* () {
    var content = fs.createReadStream(path.join(fixtures, '500.txt'));
    mm.http.request(/\//, content, { statusCode: 500 });
    // http://registry.npmjs.org/octopie
    try {
      yield npm.get('octopie');
      throw new Error('should not run this');
    } catch (err) {
      err.name.should.equal('NPMServerError');
      err.message.should.containEql('Status 500, ' +
        fs.readFileSync(path.join(fixtures, '500.txt'), 'utf8'));
    }
  });

  describe('request()', () => {
    it('should request from replicate and clean meta data', function* () {
      const result = yield npm.request('/shelljs', {
        registry: config.officialNpmReplicate,
      });
      const pkg = result.data;
      pkg.name.should.equal('shelljs');
      pkg.time['0.0.1-alpha1'].should.equal('2012-03-02T21:46:14.725Z');
      pkg.versions['0.0.1-alpha1'].version.should.equal('0.0.1-alpha1');
      pkg.versions['0.0.1-alpha1'].dist.shasum.should.equal('cfa9394e29c3eb0fe58998f5bf5bda79aa7d3e2e');
      pkg.versions['0.0.1-alpha1'].dist.tarball.should.equal('http://registry.npmjs.org/shelljs/-/shelljs-0.0.1alpha1.tgz');

      pkg.time['0.7.5'].should.equal('2016-10-27T05:50:21.479Z');
      pkg.versions['0.7.5'].version.should.equal('0.7.5');
      pkg.versions['0.7.5'].dist.shasum.should.equal('2eef7a50a21e1ccf37da00df767ec69e30ad0675');
      pkg.versions['0.7.5'].dist.tarball.should.equal('http://registry.npmjs.org/shelljs/-/shelljs-0.7.5.tgz');

      pkg.time['0.0.6-pre2'].should.equal('2012-05-25T18:14:25.441Z');
      pkg.versions['0.0.6-pre2'].version.should.equal('0.0.6-pre2');
      pkg.versions['0.0.6-pre2'].dist.shasum.should.equal('8c3eecaddba6f425bd5cae001f80a4d224750911');
      pkg.versions['0.0.6-pre2'].dist.tarball.should.equal('http://registry.npmjs.org/shelljs/-/shelljs-0.0.6pre2.tgz');
    });
  });

  describe('getPopular()', () => {
    it('should return popular modules', function* () {
      mm.http.request(/\//, JSON.stringify({
        rows: [
          { key: ['foo0'], value: 1 },
          { key: ['foo1'], value: 1 },
          { key: ['foo2'], value: 1 },
          { key: ['foo3'], value: 1 },
          { key: ['foo4'], value: 1 },
          { key: ['foo5'], value: 1 },
          { key: ['foo6'], value: 1 },
          { key: ['foo7'], value: 1 },
          { key: ['foo8'], value: 1 },
          { key: ['foo9'], value: 1 },
          { key: ['foo10'], value: 1 },
          { key: ['underscore'], value: 1001 },
          { key: ['foo12'], value: 100 },
          { key: ['foo13'], value: 1 },
          { key: ['foo14'], value: 1 },
          { key: ['foo15'], value: 1 },
        ]
      }));
      var rows = yield npm.getPopular(10);
      rows.should.length(2);
      rows[0][0].should.equal('underscore');
    });
  });
});
