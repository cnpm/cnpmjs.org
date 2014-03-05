/*!
 * cnpmjs.org - controllers/web/package.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */
var Module = require('../../proxy/module');
var User = require('../../proxy/user');

exports.display = function *(next) {
  var name = this.params.name;

  var r = yield [Module.listByAuthor(name), User.get(name)];
  var packages = r[0];
  var user = r[1];
  if (!user && !packages.length) {
    return yield* next;
  }
  user = {
    name: name,
    email: user && user.email
  };

  yield this.render('profile', {
    title: 'User - ' + name,
    packages: packages || [],
    user: user
  });
};
