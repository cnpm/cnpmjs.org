'use strict';

const runScript = require('runscript');
const initDb = require.resolve('./init_db');

before(() => {
  return runScript(`node ${initDb}`);
});
