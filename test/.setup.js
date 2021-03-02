'use strict';

const { app } = require('egg-mock/bootstrap');

before(async () => {
  await app.orm.sync();
});

beforeEach(async () => {
  await app.orm.User.driver.query('TRUNCATE user');
});
