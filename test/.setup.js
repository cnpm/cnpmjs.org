'use strict';

const { app } = require('egg-mock/bootstrap');

beforeEach(async () => {
  await app.orm.User.driver.query('TRUNCATE user');
});
