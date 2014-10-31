/**!
 * cnpmjs.org - controllers/registry/user/show.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var userService = require('../../../services/user');

// GET /-/user/org.couchdb.user::name
module.exports = function* show(next) {
  var name = this.params.name;
  var user = yield* userService.getAndSave(name);
  if (!user) {
    return yield* next;
  }

  var data = user.json;
  if (!data) {
    data = {
      _id: 'org.couchdb.user:' + user.name,
      _rev: user.rev,
      name: user.name,
      email: user.email,
      type: 'user',
      roles: [],
      date: user.gmt_modified,
    };
  }

  if (data.login) {
    // custom user format
    // convert to npm user format
    data = {
      _id: 'org.couchdb.user:' + user.name,
      _rev: user.rev,
      name: user.name,
      email: user.email,
      type: 'user',
      roles: [],
      date: user.gmt_modified,
      avatar: data.avatar_url,
      fullname: data.name || data.login,
      homepage: data.html_url,
      scopes: data.scopes,
      site_admin: data.site_admin
    };
  }

  data._cnpm_meta = {
    id: user.id,
    npm_user: user.isNpmUser,
    custom_user: !!data.login,
    gmt_create: user.gmt_create,
    gmt_modified: user.gmt_modified,
  };

  this.body = data;
};
