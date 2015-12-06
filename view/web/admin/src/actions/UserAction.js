const UserDispatcher = require('../dispatchers/UserDispatcher');
const UserConstants = require('../constants/UserConstants');

const ActionTypes = UserConstants.ActionTypes;

const superagent = require('superagent');

function addHeader(request) {
  request.set('X-Web-Client', 'true');
  return request;
}

module.exports = {
  fetchList: function (page, cond) {
    superagent.get('/admin/user')
      .use(addHeader)
      .query({page, cond})
      .end(function (err, res) {
        if (err) {
          if (res.body.error === 'unauthorized') {
            location.href = res.body.redirect
          }
        } else {
          UserDispatcher.dispatch({
            type: ActionTypes.FETCH_LIST,
            data: res.body
          })
        }
      })
  },

  setAdmin: function (row) {
    superagent.put('/admin/user/' + row.id)
    .send({role: Number(!row.role)})
    .end(function (err, res) {
      if (err) {
        console.log(err)
      }
      UserDispatcher.dispatch({
        type: ActionTypes.SET_ADMIN,
        data: res.body
      })
    })
  }
};
