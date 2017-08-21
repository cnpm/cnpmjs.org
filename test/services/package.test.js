/**!
 * cnpmjs.org - test/services/package.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var sleep = require('co-sleep');
var Package = require('../../services/package');
var utils = require('../utils');

describe('test/services/package.test.js', function () {
  function* createModule(name, version, user, tag) {
    var sourcePackage = {
      version: version,
      name: name,
      publish_time: Date.now(),
    };
    var mod = {
      version: sourcePackage.version,
      name: sourcePackage.name,
      package: sourcePackage,
      author: user || 'unittest',
      publish_time: sourcePackage.publish_time,
    };
    var dist = {
      tarball: 'http://registry.npmjs.org/' + name + '/-/' + name + '-' + version + '.tgz',
      shasum: '9d7bc446e77963933301dd602d5731cb861135e0',
      size: 100,
    };
    mod.package.dist = dist;
    yield Package.saveModule(mod);
    yield Package.saveModuleAbbreviated(mod);
    // add tag
    yield Package.addModuleTag(name, tag || 'latest', version);
    return yield Package.getModule(mod.name, mod.version);
  }

  describe('addModuleTag()', function () {
    it('should add latest tag to 1.0.0', function* () {
      var r = yield createModule('test-addModuleTag-module-name', '1.0.0');
      var tag = yield Package.addModuleTag(r.name, 'latest', r.version);
      should.exist(tag);
      tag.id.should.above(0);

      r = yield createModule('test-addModuleTag-module-name', '1.1.0');
      var tag2 = yield Package.addModuleTag(r.name, 'latest', r.version);
      should.exist(tag2);
      tag.id.should.equal(tag2.id);

      var tag3 = yield Package.getModuleTag(r.name, 'latest');
      tag3.id.should.equal(tag2.id);
    });

    it('should return null when module not exists', function* () {
      var tag = yield Package.addModuleTag('not-exists', 'latest', '1.0.0');
      should.not.exist(tag);
    });
  });

  describe('getModuleByTag()', function () {
    it('should get latest module', function* () {
      var r = yield createModule('test-getModuleByTag-module-name', '1.0.0');
      var tag = yield Package.addModuleTag(r.name, 'latest', r.version);
      should.exist(tag);

      var mod = yield Package.getModuleByTag(r.name, 'latest');
      should.exist(mod);
      mod.name.should.equal(r.name);
      mod.version.should.equal(r.version);
      mod.package.should.eql(r.package);
    });

    it('should return null when tag not exists', function* () {
      var r = yield Package.getModuleByTag('some', 'not-exists');
      should.not.exist(r);
    });
  });

  describe('listMaintainers()', function () {
    before(function (done) {
      utils.sync('enable', done);
    });

    it('should show public package maintainers', function* () {
      var users = yield Package.listMaintainers('enable');
      users.length.should.above(0);
      users[0].should.have.keys('name', 'email');
    });

    it('should show private package maintainers', function* () {
      var users = yield Package.listMaintainers('@cnpmtest/enable');
      users.should.be.an.Array;
    });
  });

  describe('listPublicModuleNamesByUser(), listPublicModulesByUser()', function () {
    before(function* () {
      yield createModule('listPublicModuleNamesByUser-module0', '1.0.0', 'listPublicModuleNamesByUser-user');
      yield createModule('listPublicModuleNamesByUser-module1', '1.0.0', 'listPublicModuleNamesByUser-user');
      yield createModule('listPublicModuleNamesByUser-module2', '1.0.0', 'listPublicModuleNamesByUser-user');
    });

    it('should got all public module names', function* () {
      var names = yield Package.listPublicModuleNamesByUser('listPublicModuleNamesByUser-user');
      names.should.length(3);
      names.sort().should.eql([
        'listPublicModuleNamesByUser-module0',
        'listPublicModuleNamesByUser-module1',
        'listPublicModuleNamesByUser-module2'
      ]);
    });

    it('should got all public modules', function* () {
      var mods = yield Package.listPublicModulesByUser('listPublicModuleNamesByUser-user');
      mods.should.length(3);
      mods.forEach(function (mod) {
        mod.toJSON().should.have.keys('name', 'description', 'version');
        mod.name.should.containEql('listPublicModuleNamesByUser-module');
      });
    });

    it('should return [] when user not exists', function* () {
      var mods = yield Package.listPublicModulesByUser('listPublicModuleNamesByUser-user-not-exists');
      mods.should.length(0);
    });
  });

  describe('listModulesByName()', function () {
    it('should return [] when module name not exists', function* () {
      var mods = yield Package.listModulesByName('not-exists-module');
      mods.should.length(0);
    });

    it('should return all version modules', function* () {
      yield createModule('test-listModulesByName-module-1', '1.0.0');
      yield createModule('test-listModulesByName-module-1', '2.0.0');
      var modules = yield Package.listModulesByName('test-listModulesByName-module-1');
      modules.should.length(2);
      modules.forEach(function (mod) {
        mod.package.name.should.equal(mod.name);
        mod.name.should.containEql('test-listModulesByName-module-');
      });
    });
  });

  describe('listPrivateModulesByScope()', function () {
    it('should return [] when scope not exists', function* () {
      var modules = yield Package.listPrivateModulesByScope('@not-exists');
      modules.should.eql([]);
    });

    it('should work', function* () {
      yield createModule('@cnpm-test/test-listPrivateModules-module-1', '1.0.0');
      yield createModule('@cnpm-test/test-listPrivateModules-module-2', '1.0.0');
      var modules = yield Package.listPrivateModulesByScope('@cnpm-test');
      modules.should.length(2);
      modules[0].name.should.containEql('@cnpm-test/test-listPrivateModules-module-');
    });
  });

  describe('listPublicModuleNamesSince(), listAllPublicModuleNames()', function () {
    it('should got those module names', function* () {
      yield createModule('test-listPublicModuleNamesSince-module-0', '1.0.0');
      yield sleep(1100);
      var start = Date.now() - 1000;
      yield createModule('test-listPublicModuleNamesSince-module-1', '1.0.0');
      yield createModule('test-listPublicModuleNamesSince-module-1', '1.0.1', null, 'beta');
      yield createModule('test-listPublicModuleNamesSince-module-2', '1.0.0');
      var names = yield Package.listPublicModuleNamesSince(start);
      names.should.length(2);
      names.should.eql(['test-listPublicModuleNamesSince-module-1', 'test-listPublicModuleNamesSince-module-2']);

      var alls = yield Package.listAllPublicModuleNames();
      alls.length.should.above(0);
      alls.forEach(function (name) {
        name.should.not.containEql('@');
      });
    });
  });

  describe('getModuleLastModified()', function () {
    it('should get a datetime', function* () {
      yield createModule('test-getModuleLastModified-module-0', '1.0.0');
      var t = yield Package.getModuleLastModified('test-getModuleLastModified-module-0');
      t.should.be.a.Date;
    });

    it('should get null when module not exists', function* () {
      var t = yield Package.getModuleLastModified('test-getModuleLastModified-module-not-exists');
      should.ok(t === null);
    });
  });

  describe('removeModulesByName()', function () {
    it('should remove all', function* () {
      yield createModule('test-removeModulesByName-module-1', '1.0.0');
      yield createModule('test-removeModulesByName-module-1', '1.0.1', null, 'beta');
      yield createModule('test-removeModulesByName-module-1', '2.0.0');

      var mods = yield Package.listModulesByName('test-removeModulesByName-module-1');
      mods.should.length(3);
      yield Package.removeModulesByName('test-removeModulesByName-module-1');
      mods = yield Package.listModulesByName('test-removeModulesByName-module-1');
      mods.should.length(0);
    });
  });

  describe('removeModulesByNameAndVersions()', function () {
    it('should remove some versions', function* () {
      yield createModule('test-removeModulesByNameAndVersions-module-1', '0.0.0');
      yield createModule('test-removeModulesByNameAndVersions-module-1', '1.0.0');
      yield createModule('test-removeModulesByNameAndVersions-module-1', '1.0.1', null, 'beta');
      yield createModule('test-removeModulesByNameAndVersions-module-1', '2.0.0');

      var mods = yield Package.listModulesByName('test-removeModulesByNameAndVersions-module-1');
      mods.should.length(4);
      var rows = yield Package.listModuleAbbreviatedsByName('test-removeModulesByNameAndVersions-module-1');
      rows.should.length(4);

      yield Package.removeModulesByNameAndVersions('test-removeModulesByNameAndVersions-module-1', ['1.0.0']);
      mods = yield Package.listModulesByName('test-removeModulesByNameAndVersions-module-1');
      mods.should.length(3);
      rows = yield Package.listModuleAbbreviatedsByName('test-removeModulesByNameAndVersions-module-1');
      rows.should.length(3);

      yield Package.removeModulesByNameAndVersions('test-removeModulesByNameAndVersions-module-1',
        ['0.0.0', '1.0.0', '1.0.1', '2.0.0']);
      mods = yield Package.listModulesByName('test-removeModulesByNameAndVersions-module-1');
      mods.should.length(0);
      rows = yield Package.listModuleAbbreviatedsByName('test-removeModulesByNameAndVersions-module-1');
      rows.should.length(0);
    });
  });

  describe('removeModuleTags()', function () {
    it('should remove all tags by name', function* () {
      var r2 = yield createModule('test-removeModuleTagsByName2-module-name', '1.0.0');
      var tag = yield Package.addModuleTag(r2.name, 'latest', r2.version);
      should.exist(tag);

      var r = yield createModule('test-removeModuleTagsByName-module-name', '1.0.0');
      var tag = yield Package.addModuleTag(r.name, 'latest', r.version);
      should.exist(tag);
      var tag = yield Package.addModuleTag(r.name, 'beta', r.version);
      should.exist(tag);

      var tags = yield Package.listModuleTags(r.name);
      tags.should.length(2);
      yield Package.removeModuleTags(r.name);
      var tags = yield Package.listModuleTags(r.name);
      tags.should.eql([]);

      var tags2 = yield Package.listModuleTags(r2.name);
      tags2.should.length(1);
    });
  });

  describe('removeModuleTagsByIds()', function () {
    it('should remove tags by ids', function* () {
      var r = yield createModule('test-removeModuleTagsByIds-module-name', '1.0.0');
      var tag1 = yield Package.addModuleTag(r.name, 'latest', r.version);
      should.exist(tag1);
      var tag2 = yield Package.addModuleTag(r.name, 'beta', r.version);
      should.exist(tag2);
      var tag3 = yield Package.addModuleTag(r.name, 'beta2', r.version);
      should.exist(tag3);

      var tags = yield Package.listModuleTags(r.name);
      tags.should.length(3);
      yield Package.removeModuleTagsByIds([tag1.id, tag3.id]);
      var tags = yield Package.listModuleTags(r.name);
      tags.should.length(1);
      tags[0].id.should.equal(tag2.id);

      yield Package.removeModuleTagsByIds([tag2.id]);
      tags = yield Package.listModuleTags(r.name);
      tags.should.length(0);
    });
  });

  describe('removeModuleTagsByNames()', function () {
    it('should remove some tags', function* () {
      var r = yield createModule('test-removeModuleTagsByNames-module-name', '1.0.0');
      var tag1 = yield Package.addModuleTag(r.name, 'latest', r.version);
      should.exist(tag1);
      var tag2 = yield Package.addModuleTag(r.name, 'beta', r.version);
      should.exist(tag2);
      var tag3 = yield Package.addModuleTag(r.name, 'beta2', r.version);
      should.exist(tag3);

      yield Package.removeModuleTagsByNames(r.name, ['beta', 'beta2']);
      var tags = yield Package.listModuleTags(r.name);
      tags.should.length(1);

      yield Package.removeModuleTagsByNames(r.name, ['beta', 'beta2', 'latest']);
      var tags = yield Package.listModuleTags(r.name);
      tags.should.length(0);
    });
  });

  describe('addModule()', function () {
    it('should success ad he@0.3.6', function* () {
      var sourcePackage = require('../fixtures/0.3.6.json');
      var mod = {
        version: sourcePackage.version,
        name: sourcePackage.name,
        package: sourcePackage,
        author: 'unittest',
        publish_time: sourcePackage.publish_time || Date.now(),
      };
      var dist = {
        tarball: 'http://registry.npmjs.org/he/-/he-0.3.6.tgz',
        shasum: '9d7bc446e77963933301dd602d5731cb861135e0',
        size: 100,
      };
      mod.package.dist = dist;
      var result = yield Package.saveModule(mod);
      result.id.should.be.a.Number;
      var item = yield Package.getModuleById(result.id);
      item.dist_size.should.equal(dist.size);
      item.dist_shasum.should.equal(dist.shasum);
      item.package.readme.should.equal(sourcePackage.readme);

      // get by name and version
      var r = yield Package.getModule(mod.name, mod.version);
      r.package.readme.should.equal(sourcePackage.readme);
    });
  });

  describe('getModuleByRange()', function() {
    it('should get undefined when not match semver range', function* () {
      yield createModule('test-getModuleByRange-module-0', '1.0.0');
      yield createModule('test-getModuleByRange-module-0', '1.1.0');
      yield createModule('test-getModuleByRange-module-0', '2.0.0');
      var mod = yield Package.getModuleByRange('test-getModuleByRange-module-0', '~2.1.0');
      should.not.exist(mod);
    });

    it('should get package with semver range', function* () {
      yield createModule('test-getModuleByRange-module-1', '1.0.0');
      yield createModule('test-getModuleByRange-module-1', '1.1.0');
      yield createModule('test-getModuleByRange-module-1', '2.0.0');
      var mod = yield Package.getModuleByRange('test-getModuleByRange-module-1', '1');
      mod.package.name.should.equal(mod.name);
      mod.name.should.equal('test-getModuleByRange-module-1');
      mod.version.should.equal('1.1.0');
    });

    it('should get package with semver range when have invalid version', function* () {
      yield createModule('test-getModuleByRange-module-2', '1.0.0');
      yield createModule('test-getModuleByRange-module-2', '1.1.0');
      yield createModule('test-getModuleByRange-module-2', 'next');
      var mod = yield Package.getModuleByRange('test-getModuleByRange-module-2', '1');
      mod.package.name.should.equal(mod.name);
      mod.name.should.equal('test-getModuleByRange-module-2');
      mod.version.should.equal('1.1.0');
    });
  });

  describe('updateModulePackage()', function () {
    it('should update not exists package return null', function* () {
      var r = yield Package.updateModulePackage(101010101, {});
      should.not.exist(r);
    });

    it('should update exists package', function* () {
      var sourcePackage = {
        version: '1.0.0',
        name: 'test-update-module-package-name',
        publish_time: Date.now(),
      };
      var mod = {
        version: sourcePackage.version,
        name: sourcePackage.name,
        package: sourcePackage,
        author: 'unittest',
        publish_time: sourcePackage.publish_time,
      };
      var dist = {
        tarball: 'http://registry.npmjs.org/he/-/he-0.3.6.tgz',
        shasum: '9d7bc446e77963933301dd602d5731cb861135e0',
        size: 100,
      };
      mod.package.dist = dist;
      yield Package.saveModule(mod);
      var result = yield Package.getModule(mod.name, mod.version);
      result.package.should.eql(sourcePackage);

      var newPackage = {foo: 'bar'};
      yield Package.updateModulePackage(result.id, newPackage);

      var r = yield Package.getModule(mod.name, mod.version);
      r.package.should.eql(newPackage);
    });
  });

  describe('updateModulePackageFields()', function () {
    it('should return null when update not exists module', function* () {
      var r = yield Package.updateModulePackageFields(123123123, {foo: 'bar'});
      should.not.exist(r);
    });

    it('should return updated module instance', function* () {
      var r = yield createModule('test-updateModulePackageFields-name', '1.0.0');
      should.exist(r);
      var r1 = yield Package.updateModulePackageFields(r.id, {foo: 'update for field'});
      r1.id.should.equal(r.id);
      var r2 = yield Package.getModuleById(r1.id);
      r2.package.should.have.property('foo', 'update for field');
    });
  });

  describe('updateModuleReadme()', function () {
    it('should return null when update not exists module', function* () {
      var r = yield Package.updateModuleReadme(123123123, 'test updateModuleReadme');
      should.not.exist(r);
    });

    it('should return updated module instance', function* () {
      var r = yield createModule('test-updateModuleReadme-name', '1.0.0');
      should.exist(r);
      var r1 = yield Package.updateModuleReadme(r.id, 'test updateModuleReadme');
      r1.id.should.equal(r.id);
      var r2 = yield Package.getModuleById(r1.id);
      r2.package.readme.should.equal('test updateModuleReadme');
    });
  });

  describe('updateModuleDescription()', function () {
    it('should return null when update not exists module', function* () {
      var r = yield Package.updateModuleDescription(123123123, 'test updateModuleDescription');
      should.not.exist(r);
    });

    it('should return updated module instance', function* () {
      var r = yield createModule('test-updateModuleDescription-name', '1.0.0');
      should.exist(r);
      var r1 = yield Package.updateModuleDescription(r.id, 'test updateModuleDescription');
      r1.id.should.equal(r.id);
      var r2 = yield Package.getModuleById(r1.id);
      r2.description.should.equal('test updateModuleDescription');
      r2.package.description.should.equal('test updateModuleDescription');
    });
  });

  describe('updateModuleLastModified()', function () {
    it('should return null when module not exists', function* () {
      var r = yield Package.updateModuleLastModified('not-exists-module-name');
      should.not.exist(r);
    });

    it('should return the update module when update lastTime exists', function* () {
      var r1 = yield createModule('test-update-module-last-modified-package-name', '1.0.0');
      yield sleep(1100);
      yield Package.updateModuleLastModified(r1.name);
      var r2 = yield Package.getModule(r1.name, r1.version);
      r2.gmt_modified.getTime().should.above(r1.gmt_modified.getTime());
    });
  });

  describe('addKeyword()', function () {
    it('should add duplicat keywords', function* () {
      var r = yield Package.addKeyword({
        name: 'addKeyword-test-name',
        keyword: 'addKeyword-test-keyword',
        description: 'addKeyword-test-description',
      });
      should.exist(r);

      var r2 = yield Package.addKeyword({
        name: 'addKeyword-test-name',
        keyword: 'addKeyword-test-keyword',
        description: 'addKeyword-test-description',
      });
      should.exist(r2);
      r2.id.should.equal(r.id);

      var r3 = yield Package.addKeyword({
        name: 'addKeyword-test-name',
        keyword: 'addKeyword-test-keyword',
        description: 'addKeyword-test-description2',
      });
      should.exist(r3);
      r3.id.should.equal(r.id);
    });
  });

  describe('search()', function () {
    before(function* () {
      yield Package.addKeywords('aaaa', 'mock aaaaaa', ['aa', 'bb', 'cc']);
    });

    it('should search modules', function* () {
      var data = yield Package.search('test');
      data.should.have.keys('keywordMatchs', 'searchMatchs');
      data.searchMatchs.length.should.above(0);
      data.searchMatchs.forEach(function (row) {
        row.name.should.be.a.String;
        row.name.indexOf('test').should.above(-1);
        row.description.should.be.a.String;
      });
    });

    it('should search match keywords modules', function* () {
      var data = yield Package.search('aa');
      data.keywordMatchs.length.should.above(0);
      data.keywordMatchs.forEach(function (row) {
        row.name.should.be.a.String;
        row.description.should.be.a.String;
      });
    });

    it('should search return empty', function* () {
      var data = yield Package.search('emptyemptyemptyempty');
      data.should.eql({
        keywordMatchs: [],
        searchMatchs: []
      });
    });
  });

  describe('addDependencies(), listDependencies(), listDependents()', function () {
    it('should add some module dependencies', function* () {
      var rows = yield Package.addDependencies('addDependencies-test-module', [
        'addDependencies-dep1',
        'addDependencies-dep2',
        'addDependencies-dep3',
        'addDependencies-dep4',
      ]);
      rows.should.length(4);
      // again should work
      rows = yield Package.addDependencies('addDependencies-test-module', [
        'addDependencies-dep1',
        'addDependencies-dep2',
        'addDependencies-dep3',
        'addDependencies-dep4',
      ]);
      rows.should.length(4);

      var dependents = yield Package.listDependents('addDependencies-dep1');
      dependents.should.eql([
        'addDependencies-test-module',
      ]);

      var names = yield Package.listDependents('addDependencies-dep1');
      names.should.eql(['addDependencies-test-module']);

      yield Package.addDependencies('addDependencies-test-module2', [
        'addDependencies-dep1',
      ]);
      names = yield Package.listDependents('addDependencies-dep1');
      names.should.eql(['addDependencies-test-module', 'addDependencies-test-module2']);
    });
  });

  describe('addStar(), removeStar(), listStarUserNames(), listUserStarModuleNames()', function () {
    it('should star a module and remove that star', function* () {
      var row = yield Package.addStar('addStar-module', 'addStar-user');
      row.id.should.be.a.Number;
      row = yield Package.addStar('addStar-module', 'addStar-user');
      row.id.should.be.a.Number;

      var users = yield Package.listStarUserNames('addStar-module');
      users.should.eql(['addStar-user']);
      var names = yield Package.listUserStarModuleNames('addStar-user');
      names.should.eql(['addStar-module']);

      yield Package.removeStar('addStar-module', 'addStar-user');
      users = yield Package.listStarUserNames('addStar-module');
      users.should.eql([]);
      names = yield Package.listUserStarModuleNames('addStar-user');
      names.should.eql([]);
    });
  });
});
