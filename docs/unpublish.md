
```
$ npm unpublish cnpm_test_module@0.0.2 --verbose
npm info it worked if it ends with ok
npm verb cli [ '/Users/deadhorse/nvm/v0.10.21/bin/node',
npm verb cli   '/Users/deadhorse/nvm/v0.10.21/bin/npm',
npm verb cli   'unpublish',
npm verb cli   'cnpm_test_module@0.0.2',
npm verb cli   '--verbose' ]
npm info using npm@1.3.11
npm info using node@v0.10.21
npm verb url raw cnpm_test_module
npm verb url resolving [ 'https://registry.npmjs.org/', './cnpm_test_module' ]
npm verb url resolved https://registry.npmjs.org/cnpm_test_module
npm info trying registry request attempt 1 at 23:32:48
npm http GET https://registry.npmjs.org/cnpm_test_module
npm http 200 https://registry.npmjs.org/cnpm_test_module
npm verb unpublish removing attachments { shasum: '7a636bfb35898e43a273e54ea980eb5f68a52196',
npm verb unpublish   tarball: 'http://registry.npmjs.org/cnpm_test_module/-/cnpm_test_module-0.0.2.tgz' }
npm verb url raw cnpm_test_module/-rev/5-db7ed4ac3f25bcdae8e554395579d515
npm verb url resolving [ 'https://registry.npmjs.org/',
npm verb url resolving   './cnpm_test_module/-rev/5-db7ed4ac3f25bcdae8e554395579d515' ]
npm verb url resolved https://registry.npmjs.org/cnpm_test_module/-rev/5-db7ed4ac3f25bcdae8e554395579d515
npm info trying registry request attempt 1 at 23:32:51
npm http PUT https://registry.npmjs.org/cnpm_test_module/-rev/5-db7ed4ac3f25bcdae8e554395579d515
npm http 201 https://registry.npmjs.org/cnpm_test_module/-rev/5-db7ed4ac3f25bcdae8e554395579d515
npm verb url raw cnpm_test_module
npm verb url resolving [ 'https://registry.npmjs.org/', './cnpm_test_module' ]
npm verb url resolved https://registry.npmjs.org/cnpm_test_module
npm info trying registry request attempt 1 at 23:32:53
npm http GET https://registry.npmjs.org/cnpm_test_module
npm http 200 https://registry.npmjs.org/cnpm_test_module
npm info detach /cnpm_test_module/-/cnpm_test_module-0.0.2.tgz/-rev/6-5de58efa3d7dd5ea258acbd406796f40
npm verb url raw /cnpm_test_module/-/cnpm_test_module-0.0.2.tgz/-rev/6-5de58efa3d7dd5ea258acbd406796f40
npm verb url resolving [ 'https://registry.npmjs.org/',
npm verb url resolving   './cnpm_test_module/-/cnpm_test_module-0.0.2.tgz/-rev/6-5de58efa3d7dd5ea258acbd406796f40' ]
npm verb url resolved https://registry.npmjs.org/cnpm_test_module/-/cnpm_test_module-0.0.2.tgz/-rev/6-5de58efa3d7dd5ea258acbd406796f40
npm info trying registry request attempt 1 at 23:32:55
npm http DELETE https://registry.npmjs.org/cnpm_test_module/-/cnpm_test_module-0.0.2.tgz/-rev/6-5de58efa3d7dd5ea258acbd406796f40
npm http 200 https://registry.npmjs.org/cnpm_test_module/-/cnpm_test_module-0.0.2.tgz/-rev/6-5de58efa3d7dd5ea258acbd406796f40
- cnpm_test_module@0.0.2
npm verb exit [ 0, true ]
npm info ok 
```
