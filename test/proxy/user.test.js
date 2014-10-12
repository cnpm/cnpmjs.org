/**!
 * cnpmjs.org - test/proxy/user.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.cnpmjs.org)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var mm = require('mm');
var path = require('path');
var fs = require('fs');
var mysql = require('../../common/mysql');
var user = require('../../proxy/user');

var fixtures = path.join(path.dirname(__dirname), 'fixtures');

var mockUser = {
  name: 'mockuser',
  email: 'mockuser@cnpmjs.org',
  salt: 'xxxxx',
  password: 'mockpassworld',
  password_sha: user.passwordSha('mockpassworld', 'xxxxx'),
  ip: '127.0.0.1'
};

function initUser(done) {
  user.add(mockUser, function (err, data) {
    mockUser.rev = data.rev;
    done(err);
  });
}

function clean(done) {
  mysql.query('DELETE FROM user WHERE name=?', [mockUser.name], done);
}

describe('proxy/user.test.js', function () {
  before(clean);
  afterEach(mm.restore);
  afterEach(clean);
});
