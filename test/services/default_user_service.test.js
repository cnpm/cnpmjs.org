'use strict';

const should = require('should');
const mm = require('mm');
const User = require('../../models').User;
const npm = require('../../services/npm');
const DefaultUserService = require('../../services/default_user_service');
const config = require('../../config');

describe('test/services/default_user_service.test.js', () => {
  const userService = new DefaultUserService();

  before(function* () {
    const user = yield npm.getUser('fengmk2');
    if (!user) {
      return;
    }
    user.fullname = 'Yuan Feng';
    yield User.saveNpmUser(user);
  });

  beforeEach(() => {
    mm(config, 'scopes', [ '@cnpm', '@cnpmtest' ]);
  });
  afterEach(mm.restore);

  describe('auth()', () => {
    it('should return user when auth success', function* () {
      const user = yield userService.auth('cnpmjstest102', 'cnpmjstest102');
      should.exist(user);
      user.should.eql({
        login: 'cnpmjstest102',
        email: 'fengmk2@gmail.com',
        name: 'cnpmjstest102',
        html_url: 'http://cnpmjs.org/~cnpmjstest102',
        avatar_url: 'https://s.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro',
        im_url: '',
        site_admin: false,
        scopes: [ '@cnpm', '@cnpmtest' ],
      });
    });

    it('should return null when auth fail', function* () {
      const user = yield userService.auth('cnpmjstest10', 'wrong');
      should.not.exist(user);
    });
  });

  describe('get()', function() {
    it('should get a cnpm admin user by login name', function* () {
      const user = yield userService.get('fengmk2');
      should.exist(user);
      user.should.eql({
        login: 'fengmk2',
        email: 'fengmk2@gmail.com',
        name: 'Yuan Feng',
        html_url: 'http://cnpmjs.org/~fengmk2',
        avatar_url: 'https://s.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro',
        im_url: '',
        site_admin: true,
        scopes: [ '@cnpm', '@cnpmtest' ],
      });
    });

    it('should get a cnpm normal user by login name', function* () {
      const user = yield userService.get('cnpmjstest101_normal_user');
      should.exist(user);
      user.should.eql({
        login: 'cnpmjstest101_normal_user',
        email: 'fengmk2@gmail.com',
        name: 'cnpmjstest101_normal_user',
        html_url: 'http://cnpmjs.org/~cnpmjstest101_normal_user',
        avatar_url: 'https://s.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro',
        im_url: '',
        site_admin: false,
        scopes: [ '@cnpm', '@cnpmtest' ],
      });
    });

    it('should get a npm sync user by login name', function* () {
      const user = yield userService.get('fengmk2');
      should.exist(user);
      user.should.eql({
        login: 'fengmk2',
        email: 'fengmk2@gmail.com',
        name: 'Yuan Feng',
        html_url: 'http://cnpmjs.org/~fengmk2',
        avatar_url: 'https://s.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro',
        im_url: '',
        site_admin: true,
        scopes: [ '@cnpm', '@cnpmtest' ],
      });
    });

    it('should get null when user not exists', function* () {
      const user = yield userService.get('not-exists');
      should.not.exist(user);
    });
  });

  describe('list()', function() {
    it('should return all exists users', function* () {
      const users = yield userService.list([ 'cnpmjstest10', 'fengmk2', 'cnpmjstest101' ]);
      users.should.length(3);
    });

    it('should return some exists users', function* () {
      const users = yield userService.list([ 'cnpmjstest10', 'fengmk2123', 'cnpmjstest101' ]);
      users.should.length(2);
    });

    it('should return []', function* () {
      let users = yield userService.list([]);
      users.should.length(0);

      users = yield userService.list([ 'not1', 'not2' ]);
      users.should.length(0);
    });
  });

  describe('search()', function() {
    it('should return login name matched users', function* () {
      const users = yield userService.search('cnpm');
      users.length.should.above(2);
    });

    it('should return limit 1 user', function* () {
      const users = yield userService.search('cnpm', { limit: 1 });
      users.should.length(1);
    });

    it('should return []', function* () {
      const users = yield userService.search('not-cnpm');
      users.should.length(0);
    });
  });
});
