/**!
 * cnpmjs.org - controllers/web/package.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var config = require('../../config');
var packageService = require('../../services/package');
var userService = require('../../services/user');
var common = require('../../lib/common');

exports.display = function* (next) {
  var name = this.params.name;
  var isAdmin = common.isAdmin(name);
  var scopes = config.scopes || [];
  if (config.customUserService) {
    var customUser = yield* userService.get(name);
    if (customUser) {
      isAdmin = !!customUser.site_admin;
      scopes = customUser.scopes;
      var data = {
        user: customUser
      };
      yield* User.saveCustomUser(data);
    }
  }

  var r = yield [Module.listByAuthor(name), User.get(name)];
  var packages = r[0] || [];
  var user = r[1];
  if (!user && !packages.length) {
    return yield* next;
  }

  user = user || {};

  var data = {
    name: name,
    email: user.email,
    json: user.json || {}
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
    lastModified: user && user.gmt_modified,
    isAdmin: isAdmin,
    scopes: scopes
  });
};
