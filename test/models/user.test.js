/**!
 * cnpmjs.org - test/models/user.test.js
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

const should = require('should');
const npm = require('../../services/npm');
const User = require('../../models').User;

describe('models/user.test.js', function() {
  describe('auth()', function() {
    it('should auth user fail when user not exist', function* () {
      const data = yield User.auth('notexistmockuser', '123');
      should.not.exist(data);
    });
  });

  describe('saveNpmUser()', function() {
    it('should save npm user json info', function* () {
      const user = yield npm.getUser('fengmk2');
      if (!user) {
        return;
      }
      user.fullname = 'Yuan Feng';
      const r = yield User.saveNpmUser(user);
      r.id.should.above(0);

      // save again
      const r2 = yield User.saveNpmUser(user);
      r2.id.should.equal(r.id);

      // save other
      user.name += 'user.test.js';
      const r3 = yield User.saveNpmUser(user);
      r3.id.should.above(r.id);
    });
  });
});
