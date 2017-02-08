'use strict';

const config = require('../../../config');
const packageService = require('../../../services/package');
const userService = require('../../../services/user');
const common = require('../../../lib/common');

module.exports = function* showUser(next) {
  const name = this.params.name;
  const isAdmin = common.isAdmin(name);
  const scopes = config.scopes || [];
  const r = yield [ packageService.listModulesByUser(name), userService.getAndSave(name) ];
  const packages = r[0];
  let user = r[1];
  if (!user && !packages.length) {
    return yield next;
  }

  user = user || {};

  const data = {
    name,
    email: user.email,
    json: user.json || {},
    isNpmUser: user.isNpmUser,
  };

  if (data.json.login) {
    // custom user format
    // convert to npm user format
    const json = data.json;
    data.json = {
      _id: 'org.couchdb.user:' + user.name,
      _rev: user.rev,
      name: user.name,
      email: user.email,
      type: 'user',
      roles: [],
      date: user.gmt_modified,
      avatar: json.avatar_url,
      fullname: json.name || json.login,
      homepage: json.html_url,
      im: json.im_url,
    };
  }

  yield this.render('profile', {
    title: 'User - ' + name,
    packages,
    user: data,
    lastModified: user.gmt_modified,
    isAdmin,
    scopes,
  });
};
