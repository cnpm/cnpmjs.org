/*!
 * cnpmjs.org - routes.js 
 * Copyright(c) 2013 
 * Author: dead_horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */
var Module = require('./controllers/module');
var Package = require('./controllers/package');
var Tag = require('./controllers/tag');

module.exports = function (app) {
  app.get('/:module', Module.show);
  app.put('/:module', Module.update);

  app.put('/:module/-/:package/-rev/:rev', Package.update);

  app.put('/:module/:version/-tag/latest', Tag.updateLatest);
};
