'use strict';

const runScript = require('runscript');
const initDb = require.resolve('./init_db');

before(function* () {
  if (process.env.DB === 'mysql') {
    yield runScript('mysql -uroot -e \'DROP DATABASE IF EXISTS cnpmjs_test;\'');
    yield runScript('mysql -uroot -e \'CREATE DATABASE cnpmjs_test;\'');
  } else if (process.env.DB === 'postgres') {
    yield runScript('psql -c \'DROP DATABASE IF EXISTS cnpmjs_test;\' -U postgres');
    yield runScript('psql -c \'CREATE DATABASE cnpmjs_test;\' -U postgres');
  }
  yield runScript(`node ${initDb}`);
});
