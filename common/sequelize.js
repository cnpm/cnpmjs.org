/**!
 * cnpmjs.org - common/sequelize.js
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
var config = require('../config').database;

var sequelize = new Sequelize(config.db, config.username, config.password, config);

// sequelize.query('select * from user where id=?', null, { raw: true }, [1])
// .then(function (rows) {
//   console.log(rows);
// })
// .catch(function (err) {
//   console.log(err);
// });

module.exports = sequelize;
