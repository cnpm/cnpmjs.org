'use strict';

const assign = require('object-assign');
const EventEmitter = require('events').EventEmitter;
const UserDispatcher = require('../dispatchers/UserDispatcher');

const CHANGE_EVENT = 'change';

const UserConstants = require('../constants/UserConstants');
const ActionTypes = UserConstants.ActionTypes;

function updateUser(modified) {
  _users.rows.forEach(function (row, index) {
    if (row.id === modified.id) {
      _users.rows[index] = modified;
    }
  });
}

let _users = {
  rows: [],
  pagination: {
    current: 1,
    total: 0
  }
};

const UserStore = assign({}, EventEmitter.prototype, {
  emitChange() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  get(id) {
    return _users.rows.filter(function (u) {
      return u.id === id;
    })[0];
  },

  getAll() {
    return _users;
  }

});

UserStore.dispatchToken = UserDispatcher.register(function(action) {
  switch (action.type) {
    case ActionTypes.FETCH_LIST:
      _users = action.data;
      UserStore.emitChange();
      break;
    case ActionTypes.SET_ADMIN:
      let modified = action.data;
      if (modified.stat == 'ok') {
        updateUser(modified.data);
        UserStore.emitChange();
      }
      break
  }
});

module.exports = UserStore;
