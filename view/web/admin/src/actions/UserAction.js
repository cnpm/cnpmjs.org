const UserDispatcher = require('../dispatchers/UserDispatcher');
const UserConstants = require('../constants/UserConstants');

const ActionTypes = UserConstants.ActionTypes;

const urllib = require('reqwest');

module.exports = {
  fetchList: function () {
    urllib({
      url: '/admin/user/',
      type: 'json',
      method: 'GET'
    }).then(function (res) {
      UserDispatcher.dispatch({
        type: ActionTypes.FETCH_LIST,
        data: res
      })
    })
  },

  setAdmin: function (row) {
    urllib({
      url: '/admin/user/' + row.id,
      type: 'json',
      method: 'PUT',
      data: {
        role: Number(!row.role)
      }
    }).then(function(res) {
      UserDispatcher.dispatch({
        type: ActionTypes.SET_ADMIN,
        data: res
      })
    })
  }
};
