/*!
 * cnpmjs.org - controllers/registry/session.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */

var MOCK_SESSION = 'ZGVhZF9ob3JzZTo1MjlFRkEwQzr9pL4PaOaFsKPycBcfGZFGBL5T7g';

exports.add = function (req, res) {
  res.cookie('AuthSession', MOCK_SESSION);
  res.json({
    ok: true,
    name: req.body.name,
    roles: []
  });
};
