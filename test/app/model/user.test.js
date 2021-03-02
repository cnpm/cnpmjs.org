'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/model/user.test.js', () => {
  describe('ctx.orm.User, app.orm.User', () => {
    it('should work', async () => {
      const ctx = app.mockContext();
      assert(ctx.orm.User);
      assert(app.orm.User);
      const user = await ctx.orm.User.create({
        name: 'fengmk2',
        salt: 'salt',
        passwordSha: 'password_sha',
        ip: 'ip',
        rev: 'rev',
        email: 'fengmk2@gmail.com',
        json: '{}',
        npmUser: '0',
      });
      assert(user.id === 1);
      assert(user.isNpmUser === false);
      await user.save();
      assert(user.id);
      const notExistsUser = await ctx.orm.User.findOne({ name: 'not-exists' });
      assert(!notExistsUser);
      const existsUser = await ctx.orm.User.findOne({ name: 'fengmk2' });
      assert(existsUser.id === user.id);
      assert(existsUser.name === user.name);
      assert(existsUser.isNpmUser === false);
    });
  });
});
