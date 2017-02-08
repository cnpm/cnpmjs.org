'use strict';

const debug = require('debug');
debug.enable('cnpmjs.org*');
const SyncModuleWorker = require('../controllers/sync_module_worker');

let names = process.argv[2] || 'enable';
names = names.split(',');

const worker = new SyncModuleWorker({
  name: names,
  username: 'fengmk2',
  concurrency: names.length,
  // noDep: true,
  // publish: true,
});

worker.start();
worker.on('end', function() {
  process.exit(0);
});
