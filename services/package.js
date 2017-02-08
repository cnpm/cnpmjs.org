'use strict';

const semver = require('semver');
const models = require('../models');
const common = require('./common');
const Tag = models.Tag;
const User = models.User;
const Module = models.Module;
const ModuleStar = models.ModuleStar;
const ModuleKeyword = models.ModuleKeyword;
const PrivateModuleMaintainer = models.ModuleMaintainer;
const ModuleDependency = models.ModuleDependency;
const ModuleUnpublished = models.ModuleUnpublished;
const NpmModuleMaintainer = models.NpmModuleMaintainer;

// module
const _parseRow = function(row) {
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
  const row = yield Module.findById(Number(id));
  parseRow(row);
  return row;
};

exports.getModule = function* (name, version) {
  const row = yield Module.findByNameAndVersion(name, version);
  parseRow(row);
  return row;
};

exports.getModuleByTag = function* (name, tag) {
  const item = yield Tag.findByNameAndTag(name, tag);
  if (!item) {
    return null;
  }
  return yield exports.getModule(item.name, item.version);
};

exports.getModuleByRange = function* (name, range) {
  const rows = yield exports.listModulesByName(name, [ 'id', 'version' ]);
  const versionMap = {};
  const versions = rows.map(function(row) {
    versionMap[row.version] = row;
    return row.version;
  }).filter(function(version) {
    return semver.valid(version);
  });

  const version = semver.maxSatisfying(versions, range);
  if (!versionMap[version]) {
    return null;
  }

  const id = versionMap[version].id;
  return yield exports.getModuleById(id);
};

exports.getLatestModule = function* (name) {
  return yield exports.getModuleByTag(name, 'latest');
};

// module:list

exports.listPrivateModulesByScope = function* (scope) {
  const tags = yield Tag.findAll({
    where: {
      tag: 'latest',
      name: {
        like: scope + '/%',
      },
    },
  });

  if (tags.length === 0) {
    return [];
  }

  const ids = tags.map(function(tag) {
    return tag.module_id;
  });

  return yield Module.findAll({
    where: {
      id: ids,
    },
  });
};

exports.listModules = function* (names) {
  if (names.length === 0) {
    return [];
  }

  // fetch latest module tags
  const tags = yield Tag.findAll({
    where: {
      name: names,
      tag: 'latest',
    },
  });
  if (tags.length === 0) {
    return [];
  }

  const ids = tags.map(function(tag) {
    return tag.module_id;
  });

  const rows = yield Module.findAll({
    where: {
      id: ids,
    },
    attributes: [
      'name', 'description', 'version',
    ],
  });
  return rows;
};

exports.listModulesByUser = function* (username) {
  const names = yield exports.listModuleNamesByUser(username);
  return yield exports.listModules(names);
};

exports.listModuleNamesByUser = function* (username) {
  const sql = 'SELECT distinct(name) AS name FROM module WHERE author=?;';
  const rows = yield models.query(sql, [ username ]);
  const map = {};
  const names = rows.map(function(r) {
    return r.name;
  });

  // find from npm module maintainer table
  let moduleNames = yield NpmModuleMaintainer.listModuleNamesByUser(username);
  moduleNames.forEach(function(name) {
    if (!map[name]) {
      names.push(name);
    }
  });

  // find from private module maintainer table
  moduleNames = yield PrivateModuleMaintainer.listModuleNamesByUser(username);
  moduleNames.forEach(function(name) {
    if (!map[name]) {
      names.push(name);
    }
  });
  return names;
};

exports.listPublicModulesByUser = function* (username) {
  const names = yield exports.listPublicModuleNamesByUser(username);
  return yield exports.listModules(names);
};

// return user all public package names
exports.listPublicModuleNamesByUser = function* (username) {
  const sql = 'SELECT distinct(name) AS name FROM module WHERE author=?;';
  const rows = yield models.query(sql, [ username ]);
  const map = {};
  const names = rows.map(function(r) {
    return r.name;
  }).filter(function(name) {
    const matched = name[0] !== '@';
    if (matched) {
      map[name] = 1;
    }
    return matched;
  });

  // find from npm module maintainer table
  const moduleNames = yield NpmModuleMaintainer.listModuleNamesByUser(username);
  moduleNames.forEach(function(name) {
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
  const rows = yield Tag.findAll({
    attributes: [ 'name' ],
    where: {
      gmt_modified: {
        gt: start,
      },
    },
  });
  const names = {};
  for (let i = 0; i < rows.length; i++) {
    names[rows[i].name] = 1;
  }
  return Object.keys(names);
};

exports.listAllPublicModuleNames = function* () {
  const sql = 'SELECT DISTINCT(name) AS name FROM tag ORDER BY name';
  const rows = yield models.query(sql);
  return rows.filter(function(row) {
    return !common.isPrivatePackage(row.name);
  }).map(function(row) {
    return row.name;
  });
};

exports.listModulesByName = function* (moduleName, attributes) {
  const mods = yield Module.findAll({
    where: {
      name: moduleName,
    },
    order: [[ 'id', 'DESC' ]],
    attributes,
  });

  for (const mod of mods) {
    parseRow(mod);
  }
  return mods;
};

exports.getModuleLastModified = function* (name) {
  const mod = yield Module.find({
    where: {
      name,
    },
    order: [
      [ 'gmt_modified', 'DESC' ],
    ],
    attributes: [ 'gmt_modified' ],
  });
  return mod && mod.gmt_modified || null;
};

// module:update
exports.saveModule = function* (mod) {
  let keywords = mod.package.keywords;
  if (typeof keywords === 'string') {
    keywords = [ keywords ];
  }
  const pkg = stringifyPackage(mod.package);
  const description = mod.package && mod.package.description || '';
  const dist = mod.package.dist || {};
  // dist.tarball = '';
  // dist.shasum = '';
  // dist.size = 0;
  const publish_time = mod.publish_time || Date.now();
  let item = yield Module.findByNameAndVersion(mod.name, mod.version);
  if (!item) {
    item = Module.build({
      name: mod.name,
      version: mod.version,
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
  const result = {
    id: item.id,
    gmt_modified: item.gmt_modified,
  };

  if (!Array.isArray(keywords)) {
    return result;
  }

  const words = [];
  for (let i = 0; i < keywords.length; i++) {
    let w = keywords[i];
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

exports.updateModulePackage = function* (id, pkg) {
  const mod = yield Module.findById(Number(id));
  if (!mod) {
    // not exists
    return null;
  }
  mod.package = stringifyPackage(pkg);
  return yield mod.save([ 'package' ]);
};

exports.updateModulePackageFields = function* (id, fields) {
  const mod = yield exports.getModuleById(id);
  if (!mod) {
    return null;
  }
  const pkg = mod.package || {};
  for (const k in fields) {
    pkg[k] = fields[k];
  }
  return yield exports.updateModulePackage(id, pkg);
};

exports.updateModuleReadme = function* (id, readme) {
  const mod = yield exports.getModuleById(id);
  if (!mod) {
    return null;
  }
  const pkg = mod.package || {};
  pkg.readme = readme;
  return yield exports.updateModulePackage(id, pkg);
};

exports.updateModuleDescription = function* (id, description) {
  const mod = yield exports.getModuleById(id);
  if (!mod) {
    return null;
  }
  mod.description = description;
  // also need to update package.description
  const pkg = mod.package || {};
  pkg.description = description;
  mod.package = stringifyPackage(pkg);

  return yield mod.save([ 'description', 'package' ]);
};

exports.updateModuleLastModified = function* (name) {
  const row = yield Module.find({
    where: { name },
    order: [[ 'gmt_modified', 'DESC' ]],
  });
  if (!row) {
    return null;
  }
  // gmt_modified is readonly, we must use setDataValue
  row.setDataValue('gmt_modified', new Date());
  return yield row.save();
};

exports.removeModulesByName = function* (name) {
  yield Module.destroy({
    where: {
      name,
    },
  });
};

exports.removeModulesByNameAndVersions = function* (name, versions) {
  yield Module.destroy({
    where: {
      name,
      version: versions,
    },
  });
};

// tags

exports.addModuleTag = function* (name, tag, version) {
  const mod = yield exports.getModule(name, version);
  if (!mod) {
    return null;
  }

  let row = yield Tag.findByNameAndTag(name, tag);
  if (!row) {
    row = Tag.build({
      name,
      tag,
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
  return yield Tag.destroy({ where: { name } });
};

exports.removeModuleTagsByIds = function* (ids) {
  return yield Tag.destroy({ where: { id: ids } });
};

exports.removeModuleTagsByNames = function* (moduleName, tagNames) {
  return yield Tag.destroy({
    where: {
      name: moduleName,
      tag: tagNames,
    },
  });
};

exports.listModuleTags = function* (name) {
  return yield Tag.findAll({ where: { name } });
};

// dependencies

// name => dependency
exports.addDependency = function* (name, dependency) {
  const row = yield ModuleDependency.find({
    where: {
      name: dependency,
      dependent: name,
    },
  });
  if (row) {
    return row;
  }
  return yield ModuleDependency.build({
    name: dependency,
    dependent: name,
  }).save();
};

exports.addDependencies = function* (name, dependencies) {
  const tasks = [];
  for (let i = 0; i < dependencies.length; i++) {
    tasks.push(exports.addDependency(name, dependencies[i]));
  }
  return yield tasks;
};

exports.listDependents = function* (dependency) {
  const items = yield ModuleDependency.findAll({
    where: {
      name: dependency,
    },
  });
  return items.map(function(item) {
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
  const result = yield PrivateModuleMaintainer.updateMaintainers(name, usernames);
  if (result.add.length > 0 || result.remove.length > 0) {
    yield exports.updateModuleLastModified(name);
  }
  return result;
};

function* getMaintainerModel(name) {
  return common.isPrivatePackage(name) ? PrivateModuleMaintainer : NpmModuleMaintainer;
}

exports.listMaintainers = function* (name) {
  const mod = yield getMaintainerModel(name);
  const usernames = yield mod.listMaintainers(name);
  if (usernames.length === 0) {
    return usernames;
  }
  const users = yield User.listByNames(usernames);
  return users.map(function(user) {
    return {
      name: user.name,
      email: user.email,
    };
  });
};

exports.listMaintainerNamesOnly = function* (name) {
  const mod = yield getMaintainerModel(name);
  return yield mod.listMaintainers(name);
};

exports.removeAllMaintainers = function* (name) {
  return yield [
    PrivateModuleMaintainer.removeAllMaintainers(name),
    NpmModuleMaintainer.removeAllMaintainers(name),
  ];
};

exports.authMaintainer = function* (packageName, username) {
  const mod = yield getMaintainerModel(packageName);
  const rs = yield [
    mod.listMaintainers(packageName),
    exports.getLatestModule(packageName),
  ];
  let maintainers = rs[0];
  const latestMod = rs[1];
  if (maintainers.length === 0) {
    // if not found maintainers, try to get from latest module package info
    const ms = latestMod && latestMod.package && latestMod.package.maintainers;
    if (ms && ms.length > 0) {
      maintainers = ms.map(function(user) {
        return user.name;
      });
    }
  }

  let isMaintainer = false;
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
    isMaintainer,
    maintainers,
  };
};

exports.isMaintainer = function* (name, username) {
  const result = yield exports.authMaintainer(name, username);
  return result.isMaintainer;
};

// module keywords

exports.addKeyword = function* (data) {
  let item = yield ModuleKeyword.findByKeywordAndName(data.keyword, data.name);
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
  const tasks = [];
  keywords.forEach(function(keyword) {
    tasks.push(exports.addKeyword({
      name,
      keyword,
      description,
    }));
  });
  return yield tasks;
};

// search

exports.search = function* (word, options) {
  options = options || {};
  const limit = options.limit || 100;
  word = word.replace(/^%/, ''); // ignore prefix %

  // search flows:
  // 1. prefix search by name
  // 2. like search by name
  // 3. keyword equal search
  let ids = {};

  const sql = `SELECT module_id FROM tag WHERE LOWER(name) LIKE LOWER(?) AND tag='latest'
    ORDER BY name LIMIT ?;`;
  let rows = yield models.query(sql, [ word + '%', limit ]);
  for (const row of rows) {
    ids[row.module_id] = 1;
  }

  if (rows.length < 20) {
    rows = yield models.query(sql, [ '%' + word + '%', limit ]);
    for (const row of rows) {
      ids[row.module_id] = 1;
    }
  }

  const keywordRows = yield ModuleKeyword.findAll({
    attributes: [ 'name', 'description' ],
    where: {
      keyword: word,
    },
    limit,
    order: [[ 'id', 'DESC' ]],
  });

  const data = {
    keywordMatchs: keywordRows,
    searchMatchs: [],
  };

  ids = Object.keys(ids);
  if (ids.length > 0) {
    data.searchMatchs = yield Module.findAll({
      attributes: [ 'name', 'description' ],
      where: {
        id: ids,
      },
      order: 'name',
    });
  }

  return data;
};

// module star

exports.addStar = function* add(name, user) {
  let row = yield ModuleStar.find({
    where: {
      name,
      user,
    },
  });
  if (row) {
    return row;
  }

  row = ModuleStar.build({
    name,
    user,
  });
  return yield row.save();
};

exports.removeStar = function* (name, user) {
  return yield ModuleStar.destroy({
    where: {
      name,
      user,
    },
  });
};

exports.listStarUserNames = function* (moduleName) {
  const rows = yield ModuleStar.findAll({
    where: {
      name: moduleName,
    },
  });
  return rows.map(function(row) {
    return row.user;
  });
};

exports.listUserStarModuleNames = function* (user) {
  const rows = yield ModuleStar.findAll({
    where: {
      user,
    },
  });
  return rows.map(function(row) {
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
