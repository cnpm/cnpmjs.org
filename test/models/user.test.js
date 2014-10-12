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

var should = require('should');
var npm = require('../../services/npm');
var User = require('../../models').User;

describe('models/user.test.js', function () {
  describe('saveNpmUser()', function () {
    it('should save npm user json info', function* () {
      var user = yield* npm.getUser('fengmk2');
      if (!user) {
        return;
      }
      user.fullname = 'Yuan Feng';
      var r = yield* User.saveNpmUser(user);
      r.id.should.above(0);
    });
  });
});
