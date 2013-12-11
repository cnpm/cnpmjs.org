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
  Module.listByAuthor(name, ep.done('packages'));
  User.get(name, ep.done('user'));

  ep.all('packages', 'user', function (packages, user) {
    //because of sync, maybe no this user in database,
    //but his packages in this registry
    if (!user && !packages.length) {
      return next();
    }
    user = {
      name: name,
      email: user && user.email
    };

    return res.render('profile', {
      title: 'User - ' + name,
      packages: packages || [],
      user: user
    });
  });
};
