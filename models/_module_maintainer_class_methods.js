/**!
 * cnpmjs.org - models/_module_maintainer_class_methods.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

module.exports = {
  listMaintainers: function* (name) {
    var rows = yield this.findAll({
      attributrs: ['user'],
      where: {
        name: name
      }
    });
    return rows.map(function (row) {
      return row.user;
    });
  },
  addMaintainer: function* (name, user) {
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
  },
  addMaintainers: function* (name, users) {
    var tasks = [];
    for (var i = 0; i < users.length; i++) {
      tasks.push(this.addMaintainer(name, users[i]));
    }
    return yield tasks;
  },
  removeMaintainers: function* (name, users) {
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
  },
  removeAllMaintainers: function* (name) {
    yield this.destroy({
      where: {
        name: name
      }
    });
  },
  updateMaintainers: function* (name, users) {
    // maintainers should be [name1, name2, ...] format
    // find out the exists maintainers then remove the deletes and add the left
    if (users.length === 0) {
      return {
        add: [],
        remove: []
      };
    }
    var exists = yield* this.listMaintainers(name);
    var addUsers = [];
    var removeUsers = [];

    for (var i = 0; i < exists.length; i++) {
      var username = exists[i];
      if (users.indexOf(username) === -1) {
        removeUsers.push(username);
      }
    }
    for (var i = 0; i < users.length; i++) {
      var username = users[i];
      if (exists.indexOf(username) === -1) {
        addUsers.push(username);
      }
    }

    yield [
      this.addMaintainers(name, addUsers),
      // make sure all add users success then remove users
      this.removeMaintainers(name, removeUsers),
    ];

    return {
      add: addUsers,
      remove: removeUsers
    };
  },
};
