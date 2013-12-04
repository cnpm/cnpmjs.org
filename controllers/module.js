/*!
 * cnpmjs.org - controllers/module.js 
 * Copyright(c) 2013 
 * Author: dead_horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */

var MOCK_MODULE_DATA = {
  _id: 'mock',
  _rev: '3-mock',
  name: 'mock',
  description: 'mock module',
  versions: {
    '0.0.0': {}
  }
};

exports.show = function (req, res) {
  res.json(MOCK_MODULE_DATA);
};

exports.update = function (req, res) {
  var params = req.params;
  if (params.module === 'exist') {
    res.statusCode = 409;
    return res.json( { error: 'conflict', reason: 'Document update conflict.' });
  }
  res.statusCode = 201;
  res.end();
};
