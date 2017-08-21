'use strict';

var semver = require('semver');
var models = require('../models');
var common = require('./common');
var config = require('../config');
var Tag = models.Tag;
var User = models.User;
var Module = models.Module;
var ModuleStar = models.ModuleStar;
var ModuleKeyword = models.ModuleKeyword;
var PrivateModuleMaintainer = models.ModuleMaintainer;
var ModuleDependency = models.ModuleDependency;
var ModuleUnpublished = models.ModuleUnpublished;
var NpmModuleMaintainer = models.NpmModuleMaintainer;

// module
var _parseRow = function (row) {
  if (row.package.indexOf('%7B%22') === 0) {
    // now store package will encodeURIComponent() after JSON.stringify
    row.package = decodeURIComponent(row.package);
  }
  row.package = JSON.parse(row.package);
  if (typeof row.publish_time === 'string') {
    // pg bigint is string
    row.publish_time = Number(row.publish_time);
  }
};

// module:read
function parseRow(row) {
  if (row && row.package) {
    try {
      _parseRow(row);
    } catch (e) {
      console.warn('parse package error: %s, id: %s version: %s, error: %s', row.name, row.id, row.version, e);
    }
  }
}
exports.parseRow = parseRow;

function stringifyPackage(pkg) {
  return encodeURIComponent(JSON.stringify(pkg));
}

exports.getModuleById = function* (id) {
  var row = yield Module.findById(Number(id));
  parseRow(row);
  return row;
};

exports.getModule = function* (name, version) {
  var row = yield Module.findByNameAndVersion(name, version);
  parseRow(row);
  return row;
};

exports.getModuleByTag = function* (name, tag) {
  var tag = yield Tag.findByNameAndTag(name, tag);
  if (!tag) {
    return null;
  }
  return yield exports.getModule(tag.name, tag.version);
};

exports.getModuleByRange = function* (name, range) {
  var rows = yield exports.listModulesByName(name, [ 'id', 'version' ]);
  var versionMap = {};
  var versions = rows.map(function(row) {
    versionMap[row.version] = row;
    return row.version;
  }).filter(function(version) {
    return semver.valid(version);
  });

  var version = semver.maxSatisfying(versions, range);
  if (!versionMap[version]) {
    return null;
  }

  var id = versionMap[version].id;
  return yield exports.getModuleById(id);
};

exports.getLatestModule = function* (name) {
  return yield exports.getModuleByTag(name, 'latest');
};

// module:list

exports.listPrivateModulesByScope = function* (scope) {
  var tags = yield Tag.findAll({
    where: {
      tag: 'latest',
      name: {
        like: scope + '/%'
      }
    }
  });

  if (tags.length === 0) {
    return [];
  }

  var ids = tags.map(function (tag) {
    return tag.module_id;
  });

  return yield Module.findAll({
    where: {
      id: ids
    }
  });
};

exports.listModules = function* (names) {
  if (names.length === 0) {
    return [];
  }

  // fetch latest module tags
  var tags = yield Tag.findAll({
    where: {
      name: names,
      tag: 'latest'
    }
  });
  if (tags.length === 0) {
    return [];
  }

  var ids = tags.map(function (tag) {
    return tag.module_id;
  });

  var rows = yield Module.findAll({
    where: {
      id: ids
    },
    attributes: [
      'name', 'description', 'version',
    ]
  });
  return rows;
};

exports.listModulesByUser = function* (username) {
  var names = yield exports.listModuleNamesByUser(username);
  return yield exports.listModules(names);
};

exports.listModuleNamesByUser = function* (username) {
  var sql = 'SELECT distinct(name) AS name FROM module WHERE author=?;';
  var rows = yield models.query(sql, [username]);
  var map = {};
  var names = rows.map(function (r) {
    return r.name;
  });

  // find from npm module maintainer table
  var moduleNames = yield NpmModuleMaintainer.listModuleNamesByUser(username);
  moduleNames.forEach(function (name) {
    if (!map[name]) {
      names.push(name);
    }
  });

  // find from private module maintainer table
  moduleNames = yield PrivateModuleMaintainer.listModuleNamesByUser(username);
  moduleNames.forEach(function (name) {
    if (!map[name]) {
      names.push(name);
    }
  });
  return names;
};

exports.listPublicModulesByUser = function* (username) {
  var names = yield exports.listPublicModuleNamesByUser(username);
  return yield exports.listModules(names);
};

// return user all public package names
exports.listPublicModuleNamesByUser = function* (username) {
  var sql = 'SELECT distinct(name) AS name FROM module WHERE author=?;';
  var rows = yield models.query(sql, [username]);
  var map = {};
  var names = rows.map(function (r) {
    return r.name;
  }).filter(function (name) {
    var matched = name[0] !== '@';
    if (matched) {
      map[name] = 1;
    }
    return matched;
  });

  // find from npm module maintainer table
  var moduleNames = yield NpmModuleMaintainer.listModuleNamesByUser(username);
  moduleNames.forEach(function (name) {
    if (!map[name]) {
      names.push(name);
    }
  });
  return names;
};

// start must be a date or timestamp
exports.listPublicModuleNamesSince = function* listPublicModuleNamesSince(start) {
  if (!(start instanceof Date)) {
    start = new Date(Number(start));
  }
  var rows = yield Tag.findAll({
    attributes: ['name'],
    where: {
      gmt_modified: {
        gt: start
      }
    },
  });
  var names = {};
  for (var i = 0; i < rows.length; i++) {
    names[rows[i].name] = 1;
  }
  return Object.keys(names);
};

exports.listAllPublicModuleNames = function* () {
  var sql = 'SELECT DISTINCT(name) AS name FROM tag ORDER BY name';
  var rows = yield models.query(sql);
  return rows.filter(function (row) {
    return !common.isPrivatePackage(row.name);
  }).map(function (row) {
    return row.name;
  });
};

exports.listModulesByName = function* (moduleName, attributes) {
  var mods = yield Module.findAll({
    where: {
      name: moduleName
    },
    order: [ ['id', 'DESC'] ],
    attributes,
  });

  for (var mod of mods) {
    parseRow(mod);
  }
  return mods;
};

exports.getModuleLastModified = function* (name) {
  var mod = yield Module.find({
    where: {
      name: name,
    },
    order: [
      ['gmt_modified', 'DESC']
    ],
    attributes: [ 'gmt_modified' ]
  });
  return mod && mod.gmt_modified || null;
};

// module:update
exports.saveModule = function* (mod) {
  var keywords = mod.package.keywords;
  if (typeof keywords === 'string') {
    keywords = [keywords];
  }
  var pkg = stringifyPackage(mod.package);
  var description = mod.package && mod.package.description || '';
  var dist = mod.package.dist || {};
  // dist.tarball = '';
  // dist.shasum = '';
  // dist.size = 0;
  var publish_time = mod.publish_time || Date.now();
  var item = yield Module.findByNameAndVersion(mod.name, mod.version);
  if (!item) {
    item = Module.build({
      name: mod.name,
      version: mod.version
    });
  }
  item.publish_time = publish_time;
  // meaning first maintainer, more maintainers please check module_maintainer table
  item.author = mod.author;
  item.package = pkg;
  item.dist_tarball = dist.tarball;
  item.dist_shasum = dist.shasum;
  item.dist_size = dist.size;
  item.description = description;

  if (item.changed()) {
    item = yield item.save();
  }
  var result = {
    id: item.id,
    gmt_modified: item.gmt_modified
  };

  if (!Array.isArray(keywords)) {
    return result;
  }

  var words = [];
  for (var i = 0; i < keywords.length; i++) {
    var w = keywords[i];
    if (typeof w === 'string') {
      w = w.trim();
      if (w) {
        words.push(w);
      }
    }
  }

  if (words.length > 0) {
    // add keywords
    yield exports.addKeywords(mod.name, description, words);
  }

  return result;
};

exports.listModuleAbbreviatedsByName = function* (name) {
  var rows = yield models.ModuleAbbreviated.findAll({
    where: {
      name: name,
    },
    order: [ ['id', 'DESC'] ],
  });

  for (var row of rows) {
    row.package = JSON.parse(row.package);
    if (row.publish_time && typeof row.publish_time === 'string') {
      // pg bigint is string
      row.publish_time = Number(row.publish_time);
    }
  }
  return rows;
};

// https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md#abbreviated-version-object
exports.saveModuleAbbreviated = function* (mod) {
  var pkg = JSON.stringify({
    name: mod.package.name,
    version: mod.package.version,
    deprecated: mod.package.deprecated,
    dependencies: mod.package.dependencies,
    optionalDependencies: mod.package.optionalDependencies,
    devDependencies: mod.package.devDependencies,
    bundleDependencies: mod.package.bundleDependencies,
    peerDependencies: mod.package.peerDependencies,
    bin: mod.package.bin,
    directories: mod.package.directories,
    dist: mod.package.dist,
    engines: mod.package.engines,
    _hasShrinkwrap: mod.package._hasShrinkwrap,
    _publish_on_cnpm: mod.package._publish_on_cnpm,
  });
  var publish_time = mod.publish_time || Date.now();
  var item = yield models.ModuleAbbreviated.findByNameAndVersion(mod.name, mod.version);
  if (!item) {
    item = models.ModuleAbbreviated.build({
      name: mod.name,
      version: mod.version,
    });
  }
  item.publish_time = publish_time;
  item.package = pkg;

  if (item.changed()) {
    item = yield item.save();
  }
  var result = {
    id: item.id,
    gmt_modified: item.gmt_modified,
  };

  return result;
};

exports.updateModulePackage = function* (id, pkg) {
  var mod = yield Module.findById(Number(id));
  if (!mod) {
    // not exists
    return null;
  }
  mod.package = stringifyPackage(pkg);
  return yield mod.save(['package']);
};

exports.updateModulePackageFields = function* (id, fields) {
  var mod = yield exports.getModuleById(id);
  if (!mod) {
    return null;
  }
  var pkg = mod.package || {};
  for (var k in fields) {
    pkg[k] = fields[k];
  }
  return yield exports.updateModulePackage(id, pkg);
};

exports.updateModuleAbbreviatedPackage = function* (item) {
  // item => { id, name, version, _hasShrinkwrap }
  var mod = yield models.ModuleAbbreviated.findByNameAndVersion(item.name, item.version);
  if (!mod) {
    return null;
  }
  var pkg = JSON.parse(mod.package);
  for (var key in item) {
    if (key === 'name' || key === 'version' || key === 'id') {
      continue;
    }
    pkg[key] = item[key];
  }
  mod.package = JSON.stringify(pkg);

  return yield mod.save([ 'package' ]);
};

exports.updateModuleReadme = function* (id, readme) {
  var mod = yield exports.getModuleById(id);
  if (!mod) {
    return null;
  }
  var pkg = mod.package || {};
  pkg.readme = readme;
  return yield exports.updateModulePackage(id, pkg);
};

exports.updateModuleDescription = function* (id, description) {
  var mod = yield exports.getModuleById(id);
  if (!mod) {
    return null;
  }
  mod.description = description;
  // also need to update package.description
  var pkg = mod.package || {};
  pkg.description = description;
  mod.package = stringifyPackage(pkg);

  return yield mod.save(['description', 'package']);
};

exports.updateModuleLastModified = function* (name) {
  var row = yield Module.find({
    where: { name: name },
    order: [ [ 'gmt_modified', 'DESC' ] ],
  });
  if (!row) {
    return null;
  }
  // gmt_modified is readonly, we must use setDataValue
  row.setDataValue('gmt_modified', new Date());
  return yield row.save();
};

// try to return latest version readme
exports.getPackageReadme = function* (name, onlyPackageReadme) {
  if (config.enableAbbreviatedMetadata) {
    var row = yield models.PackageReadme.findByName(name);
    if (row) {
      return {
        version: row.version,
        readme: row.readme,
      };
    }
    if (onlyPackageReadme) {
      return;
    }
  }

  var mod = yield exports.getLatestModule(name);
  if (mod) {
    return {
      version: mod.package.version,
      readme: mod.package.readme,
    };
  }
};

exports.savePackageReadme = function* (name, readme, latestVersion) {
  var item = yield models.PackageReadme.find({ where: { name: name } });
  if (!item) {
    item = models.PackageReadme.build({
      name: name,
    });
  }
  item.readme = readme;
  item.version = latestVersion;
  return yield item.save();
};

exports.removeModulesByName = function* (name) {
  yield Module.destroy({
    where: {
      name: name,
    },
  });
  if (config.enableAbbreviatedMetadata) {
    yield models.ModuleAbbreviated.destroy({
      where: {
        name: name,
      },
    });
  }
};

exports.removeModulesByNameAndVersions = function* (name, versions) {
  yield Module.destroy({
    where: {
      name: name,
      version: versions,
    }
  });
  if (config.enableAbbreviatedMetadata) {
    yield models.ModuleAbbreviated.destroy({
      where: {
        name: name,
        version: versions,
      },
    });
  }
};

// tags

exports.addModuleTag = function* (name, tag, version) {
  var mod = yield exports.getModule(name, version);
  if (!mod) {
    return null;
  }

  var row = yield Tag.findByNameAndTag(name, tag);
  if (!row) {
    row = Tag.build({
      name: name,
      tag: tag
    });
  }
  row.module_id = mod.id;
  row.version = version;
  if (row.changed()) {
    return yield row.save();
  }
  return row;
};

exports.getModuleTag = function* (name, tag) {
  return yield Tag.findByNameAndTag(name, tag);
};

exports.removeModuleTags = function* (name) {
  return yield Tag.destroy({where: {name: name}});
};

exports.removeModuleTagsByIds = function* (ids) {
  return yield Tag.destroy({where: {id: ids}});
};

exports.removeModuleTagsByNames = function* (moduleName, tagNames) {
  return yield Tag.destroy({
    where: {
      name: moduleName,
      tag: tagNames
    }
  });
};

exports.listModuleTags = function* (name) {
  return yield Tag.findAll({ where: { name: name } });
};

// dependencies

// name => dependency
exports.addDependency = function* (name, dependency) {
  var row = yield ModuleDependency.find({
    where: {
      name: dependency,
      dependent: name
    }
  });
  if (row) {
    return row;
  }
  return yield ModuleDependency.build({
    name: dependency,
    dependent: name
  }).save();
};

exports.addDependencies = function* (name, dependencies) {
  var tasks = [];
  for (var i = 0; i < dependencies.length; i++) {
    tasks.push(exports.addDependency(name, dependencies[i]));
  }
  return yield tasks;
};

exports.listDependents = function* (dependency) {
  var items = yield ModuleDependency.findAll({
    where: {
      name: dependency
    }
  });
  return items.map(function (item) {
    return item.dependent;
  });
};

// maintainers

exports.listPublicModuleMaintainers = function* (name) {
  return yield NpmModuleMaintainer.listMaintainers(name);
};

exports.addPublicModuleMaintainer = function* (name, user) {
  return yield NpmModuleMaintainer.addMaintainer(name, user);
};

exports.removePublicModuleMaintainer = function* (name, user) {
  return yield NpmModuleMaintainer.removeMaintainers(name, user);
};

// only can add to cnpm maintainer table
exports.addPrivateModuleMaintainers = function* (name, usernames) {
  return yield PrivateModuleMaintainer.addMaintainers(name, usernames);
};

exports.updatePrivateModuleMaintainers = function* (name, usernames) {
  var result = yield PrivateModuleMaintainer.updateMaintainers(name, usernames);
  if (result.add.length > 0 || result.remove.length > 0) {
    yield exports.updateModuleLastModified(name);
  }
  return result;
};

function* getMaintainerModel(name) {
  return common.isPrivatePackage(name) ? PrivateModuleMaintainer : NpmModuleMaintainer;
}

exports.listMaintainers = function* (name) {
  var mod = yield getMaintainerModel(name);
  var usernames = yield mod.listMaintainers(name);
  if (usernames.length === 0) {
    return usernames;
  }
  var users = yield User.listByNames(usernames);
  return users.map(function (user) {
    return {
      name: user.name,
      email: user.email
    };
  });
};

exports.listMaintainerNamesOnly = function* (name) {
  var mod = yield getMaintainerModel(name);
  return yield mod.listMaintainers(name);
};

exports.removeAllMaintainers = function* (name) {
  return yield [
    PrivateModuleMaintainer.removeAllMaintainers(name),
    NpmModuleMaintainer.removeAllMaintainers(name),
  ];
};

exports.authMaintainer = function* (packageName, username) {
  var mod = yield getMaintainerModel(packageName);
  var rs = yield [
    mod.listMaintainers(packageName),
    exports.getLatestModule(packageName)
  ];
  var maintainers = rs[0];
  var latestMod = rs[1];
  if (maintainers.length === 0) {
    // if not found maintainers, try to get from latest module package info
    var ms = latestMod && latestMod.package && latestMod.package.maintainers;
    if (ms && ms.length > 0) {
      maintainers = ms.map(function (user) {
        return user.name;
      });
    }
  }

  var isMaintainer = false;
  if (latestMod && !latestMod.package._publish_on_cnpm) {
    // no one can update public package maintainers
    // public package only sync from source npm registry
    isMaintainer = false;
  } else if (maintainers.length === 0) {
    // no maintainers, meaning this module is free for everyone
    isMaintainer = true;
  } else if (maintainers.indexOf(username) >= 0) {
    isMaintainer = true;
  }

  return {
    isMaintainer: isMaintainer,
    maintainers: maintainers
  };
};

exports.isMaintainer = function* (name, username) {
  var result = yield exports.authMaintainer(name, username);
  return result.isMaintainer;
};

// module keywords

exports.addKeyword = function* (data) {
  var item = yield ModuleKeyword.findByKeywordAndName(data.keyword, data.name);
  if (!item) {
    item = ModuleKeyword.build(data);
  }
  item.description = data.description;
  if (item.changed()) {
    // make sure object will change, otherwise will cause empty sql error
    // @see https://github.com/cnpm/cnpmjs.org/issues/533
    return yield item.save();
  }
  return item;
};

exports.addKeywords = function* (name, description, keywords) {
  var tasks = [];
  keywords.forEach(function (keyword) {
    tasks.push(exports.addKeyword({
      name: name,
      keyword: keyword,
      description: description
    }));
  });
  return yield tasks;
};

// search

exports.search = function* (word, options) {
  options = options || {};
  var limit = options.limit || 100;
  word = word.replace(/^%/, ''); //ignore prefix %

  // search flows:
  // 1. prefix search by name
  // 2. like search by name
  // 3. keyword equal search
  var ids = {};

  var sql = 'SELECT module_id FROM tag WHERE LOWER(name) LIKE LOWER(?) AND tag=\'latest\' \
    ORDER BY name LIMIT ?;';
  var rows = yield models.query(sql, [word + '%', limit ]);
  for (var i = 0; i < rows.length; i++) {
    ids[rows[i].module_id] = 1;
  }

  if (rows.length < 20) {
    rows = yield models.query(sql, [ '%' + word + '%', limit ]);
    for (var i = 0; i < rows.length; i++) {
      ids[rows[i].module_id] = 1;
    }
  }

  var keywordRows = yield ModuleKeyword.findAll({
    attributes: [ 'name', 'description' ],
    where: {
      keyword: word
    },
    limit: limit,
    order: [ [ 'id', 'DESC' ] ]
  });

  var data = {
    keywordMatchs: keywordRows,
    searchMatchs: []
  };

  ids = Object.keys(ids);
  if (ids.length > 0) {
    data.searchMatchs = yield Module.findAll({
      attributes: [ 'name', 'description' ],
      where: {
        id: ids
      },
      order: 'name'
    });
  }

  return data;
};

// module star

exports.addStar = function* add(name, user) {
  var row = yield ModuleStar.find({
    where: {
      name: name,
      user: user
    }
  });
  if (row) {
    return row;
  }

  row = ModuleStar.build({
    name: name,
    user: user
  });
  return yield row.save();
};

exports.removeStar = function* (name, user) {
  return yield ModuleStar.destroy({
    where: {
      name: name,
      user: user
    }
  });
};

exports.listStarUserNames = function* (moduleName) {
  var rows = yield ModuleStar.findAll({
    where: {
      name: moduleName
    }
  });
  return rows.map(function (row) {
    return row.user;
  });
};

exports.listUserStarModuleNames = function* (user) {
  var rows = yield ModuleStar.findAll({
    where: {
      user: user
    }
  });
  return rows.map(function (row) {
    return row.name;
  });
};

// unpublish info
exports.saveUnpublishedModule = function* (name, pkg) {
  return yield ModuleUnpublished.save(name, pkg);
};

exports.getUnpublishedModule = function* (name) {
  return yield ModuleUnpublished.findByName(name);
};
