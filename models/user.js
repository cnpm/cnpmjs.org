/**!
 * cnpmjs.org - models/user.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var Sequelize = require('sequelize');

var sequelize = new Sequelize('database', 'username', 'password', {
  // mysql is the default dialect, but you know...
  // for demo purporses we are defining it nevertheless :)
  // so: we want mysql!
  dialect: 'mysql'
});
