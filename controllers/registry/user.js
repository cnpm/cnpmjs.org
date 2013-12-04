/*!
 * cnpmjs.org - controllers/registry/user.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var MOCK_USER_DATA = {
  _id: 'org.couchdb.user:exist',
  _rev: '24-29a410ffe8c2250d3ca1a856d8f913ad',
  name: 'exist',
  email: 'exist@gmail.com',
  type: 'user',
  roles: [],
  date: '2013-12-04T02:03:08.540Z',
  mustChangePass: false,
  _etag: '"24-29a410ffe8c2250d3ca1a856d8f913ad"'
};

exports.show = function (req, res) {
  var name = req.params.name;
   //auth token in header: authorization: 'Basic ZXhpc3EWdf=='
  var auth = (req.headers.authorization || '').split(' ')[1];

  //mock, only exist with passworld 123 can pass this
  if (auth !== 'ZXhpc3Q6MTIz') {
    res.statusCode = 401;
    return res.json({
      error: 'unauthorized',
      reason: 'Name or password is incorrect.'
    });
  }
  res.statusCode = 200;
  res.json(MOCK_USER_DATA);
};

exports.add = function (req, res) {
  var name = req.params.name;
  //mock only username === exist return 409
  if (name === 'org.couchdb.user:exist') {
    res.statusCode = 409;
    return res.json({
      error: 'conflict',
      reason: 'Document update conflict.'
    });
  }
  res.statusCode = 201;
  res.end();
};

exports.upload = function (req, res) {
  res.statusCode = 201;
  res.end();
};
