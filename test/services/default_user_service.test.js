/**
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var mm = require('mm');
var User = require('../../models').User;
var npm = require('../../services/npm');
var DefaultUserService = require('../../services/default_user_service');
var config = require('../../config');

describe('services/default_user_service.test.js', function () {
  var userService = new DefaultUserService();

  before(function* () {
    var user = yield npm.getUser('fengmk2');
    if (!user) {
      return;
    }
    user.fullname = 'Yuan Feng';
    yield User.saveNpmUser(user);
  });

  beforeEach(function () {
    mm(config, 'scopes', ['@cnpm', '@cnpmtest']);
  });
  afterEach(mm.restore);

  describe('auth()', function () {
    it('should return user when auth success', function* () {
      var user = yield userService.auth('cnpmjstest10', 'cnpmjstest10');
      should.exist(user);
      user.should.eql({
        login: 'cnpmjstest10',
        email: 'fengmk2@gmail.com',
        name: 'cnpmjstest10',
        html_url: 'http://cnpmjs.org/~cnpmjstest10',
        avatar_url: 'https://s.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro',
        im_url: '',
        site_admin: true,
        scopes: ['@cnpm', '@cnpmtest'],
      });
    });

    it('should return null when auth fail', function* () {
      var user = yield userService.auth('cnpmjstest10', 'wrong');
      should.not.exist(user);
    });
  });

  describe('get()', function () {
    it('should get a cnpm admin user by login name', function* () {
      var user = yield userService.get('cnpmjstest10');
      should.exist(user);
      user.should.eql({
        login: 'cnpmjstest10',
        email: 'fengmk2@gmail.com',
        name: 'cnpmjstest10',
        html_url: 'http://cnpmjs.org/~cnpmjstest10',
        avatar_url: 'https://s.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro',
        im_url: '',
        site_admin: true,
        scopes: ['@cnpm', '@cnpmtest'],
      });
    });

    it('should get a cnpm normal user by login name', function* () {
      var user = yield userService.get('cnpmjstest101');
      should.exist(user);
      user.should.eql({
        login: 'cnpmjstest101',
        email: 'fengmk2@gmail.com',
        name: 'cnpmjstest101',
        html_url: 'http://cnpmjs.org/~cnpmjstest101',
        avatar_url: 'https://s.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro',
        im_url: '',
        site_admin: false,
        scopes: ['@cnpm', '@cnpmtest'],
      });
    });

    it('should get a npm sync user by login name', function* () {
      var user = yield userService.get('fengmk2');
      should.exist(user);
      user.should.eql({
        login: 'fengmk2',
        email: 'fengmk2@gmail.com',
        name: 'Yuan Feng',
        html_url: 'http://cnpmjs.org/~fengmk2',
        avatar_url: 'https://s.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro',
        im_url: '',
        site_admin: true,
        scopes: ['@cnpm', '@cnpmtest'],
      });
    });

    it('should get null when user not exists', function* () {
      var user = yield userService.get('not-exists');
      should.not.exist(user);
    });
  });

  describe('list()', function () {
    it('should return all exists users', function* () {
      var users = yield userService.list(['cnpmjstest10', 'fengmk2', 'cnpmjstest101']);
      users.should.length(3);
    });

    it('should return some exists users', function* () {
      var users = yield userService.list(['cnpmjstest10', 'fengmk2123', 'cnpmjstest101']);
      users.should.length(2);
    });

    it('should return []', function* () {
      var users = yield userService.list([]);
      users.should.length(0);

      var users = yield userService.list(['not1', 'not2']);
      users.should.length(0);
    });
  });

  describe('search()', function () {
    it('should return login name matched users', function* () {
      var users = yield userService.search('cnpm');
      users.length.should.above(2);
    });

    it('should return limit 1 user', function* () {
      var users = yield userService.search('cnpm', {limit: 1});
      users.should.length(1);
    });

    it('should return []', function* () {
      var users = yield userService.search('not-cnpm');
      users.should.length(0);
    });
  });
});
