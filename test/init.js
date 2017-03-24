'use strict';

var config = require('../config');

if (process.env.DB) {
  config.database.dialect = process.env.DB;
}

if (process.env.DB_PORT) {
  config.database.port = parseInt(process.env.DB_PORT);
}

if (process.env.DB_USER) {
  config.database.username = process.env.DB_USER;
}

if (process.env.CNPM_SOURCE_NPM) {
  config.sourceNpmRegistry = process.env.CNPM_SOURCE_NPM;
}
if (process.env.CNPM_SOURCE_NPM_ISCNPM === 'false') {
  config.sourceNpmRegistryIsCNpm = false;
}
