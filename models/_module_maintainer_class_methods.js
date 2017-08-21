'use strict';

/**
 * list all module names by user
 * @param {String} user
 */

exports.listModuleNamesByUser = function* (user) {
  var rows = yield this.findAll({
    attributrs: ['name'],
    where: {
      user: user
    }
  });
  return rows.map(function (row) {
    return row.name;
  });
};

/**
 * list all maintainers of module `name`
 * @param {String} name
 */

exports.listMaintainers = function* (name) {
  var rows = yield this.findAll({
    attributrs: ['user'],
    where: {
      name: name
    }
  });
  return rows.map(function (row) {
    return row.user;
  });
};

/**
 * add a maintainer for module `name`
 * @param {String} name
 * @param {String} user
 */

exports.addMaintainer = function* (name, user) {
  var row = yield this.find({
    where: {
      user: user,
      name: name
    }
  });
  if (!row) {
    row = yield this.build({
      user: user,
      name: name
    }).save();
  }
  return row;
};

/**
 * add maintainers for module `name`
 * @param {String} name
 * @param {Array} users
 */

exports.addMaintainers = function* (name, users) {
  return yield users.map(function (user) {
    return this.addMaintainer(name, user);
  }.bind(this));
};

/**
 * remove maintainers for module `name`
 * @param {String} name
 * @param {Array} users
 */

exports.removeMaintainers = function* (name, users) {
  // removeMaintainers(name, oneUserName)
  if (typeof users === 'string') {
    users = [users];
  }
  if (users.length === 0) {
    return;
  }
  yield this.destroy({
    where: {
      name: name,
      user: users,
    }
  });
};

/**
 * remove all maintainers for module `name`
 * @param {String} name
 */

exports.removeAllMaintainers = function* (name) {
  yield this.destroy({
    where: {
      name: name
    }
  });
};

/**
 * add maintainers to module
 * @param {String} name
 * @param {Array} users
 */

exports.updateMaintainers = function* (name, users) {
  // maintainers should be [username1, username2, ...] format
  // find out the exists maintainers
  // then remove all the users not present and add all the left

  if (users.length === 0) {
    return {
      add: [],
      remove: []
    };
  }
  var exists = yield this.listMaintainers(name);

  var addUsers = users.filter(function (username) {
    // add user which in `users` but do not in `exists`
    return exists.indexOf(username) === -1;
  });

  var removeUsers = exists.filter(function (username) {
    // remove user which in `exists` by not in `users`
    return users.indexOf(username) === -1;
  });

  yield [
    this.addMaintainers(name, addUsers),
    this.removeMaintainers(name, removeUsers),
  ];

  return {
    add: addUsers,
    remove: removeUsers
  };
};
