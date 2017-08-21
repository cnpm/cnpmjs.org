'use strict';

var config = require('../../../config');
var packageService = require('../../../services/package');
var userService = require('../../../services/user');
var common = require('../../../lib/common');

module.exports = function* showUser(next) {
  var name = this.params.name;
  var isAdmin = common.isAdmin(name);
  var scopes = config.scopes || [];
  var user;
  var r = yield [packageService.listModulesByUser(name), userService.getAndSave(name)];
  var packages = r[0];
  var user = r[1];
  if (!user && !packages.length) {
    return yield next;
  }

  user = user || {};

  var data = {
    name: name,
    email: user.email,
    json: user.json || {},
    isNpmUser: user.isNpmUser,
  };

  if (data.json.login) {
    // custom user format
    // convert to npm user format
    var json = data.json;
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
      im: json.im_url
    };
  }

  yield this.render('profile', {
    title: 'User - ' + name,
    packages: packages,
    user: data,
    lastModified: user.gmt_modified,
    isAdmin: isAdmin,
    scopes: scopes
  });
};
