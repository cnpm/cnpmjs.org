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
var eventproxy = require('eventproxy');

exports.display = function (req, res, next) {
  var name = req.params.name;

  var ep = eventproxy.create();
  ep.fail(next);
  Module.listByAuthor(name, ep.done('modules'));
  User.get(name, ep.done('user'));

  ep.all('modules', 'user', function (modules, user) {
    //because of sync, maybe no this user in database,
    //but his modules in this registry
    if (!user && !modules.length) {
      return next();
    }
    user = user || {};
    var packages = modules.map(function (m) {
      try {
        m.package = JSON.parse(m.package);
      } catch (err) {
        m.package = {};
      }
      return {
        name: m.package.name,
        description: m.package.description
      };
    });
    user = {
      name: name,
      email: user.email
    };

    return res.render('profile', {
      packages: packages || [],
      user: user
    });
  });
};
