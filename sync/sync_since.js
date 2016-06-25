'use strict';

const thunkify = require('thunkify-wrap');
const co = require('co');
const ms = require('humanize-ms');
const npmService = require('../services/npm');
const SyncModuleWorker = require('../controllers/sync_module_worker');

function* sync(sinceTimestamp) {
  console.log('Fetching packages since: %s', new Date(sinceTimestamp));
  var result = yield npmService.fetchAllPackagesSince(sinceTimestamp);
  var packages = result.names;

  packages = packages || [];
  if (!packages.length) {
    console.log('no packages need be sync');
    process.exit(0);
  }
  // var news = [];
  // for (var i = 0; i < packages.length; i++) {
  //   if (packages[i] === 'elwms') {
  //     news = packages.slice(i);
  //     break;
  //   }
  // }
  // packages = news;
  console.log('lastModified: %s, lastModified package: %s, total %d packages to sync: %j',
    new Date(result.lastModified), result.lastModifiedName, packages.length, packages);

  var worker = new SyncModuleWorker({
    username: 'sync_since',
    name: packages,
    noDep: true,
    concurrency: 1,
    syncUpstreamFirst: false,
  });
  worker.start();
  var end = thunkify.event(worker);
  yield end();

  console.log('All packages sync done, successes %d, fails %d',
      worker.successes.length, worker.fails.length);
  process.exit(0);
}

co(function* () {
  var timestamp = Date.now() - ms(process.argv[2] || '30d');
  yield sync(timestamp);
}).catch(function (err) {
  console.error(err.stack);
  process.exit(1);
});
