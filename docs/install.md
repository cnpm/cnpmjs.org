# npm install flow

```
npm install pkg
npm install pkg@<version range>
npm install pkg@<version>
npm install pkg@<tag>
```

* `npm install pkg` & `npm install pkg@<version range>` are just get '/:pkg' to get the info.
* `npm install pkg@version` GET '/:pkg/:version' to get pkg@version data.

```
$ npm install cnpm_test_module@0.0.2 --verbose --registry=http://127.0.0.1:7001
npm info it worked if it ends with ok
npm verb cli [ '/Users/deadhorse/nvm/v0.10.21/bin/node',
npm verb cli   '/Users/deadhorse/nvm/v0.10.21/bin/npm',
npm verb cli   'install',
npm verb cli   'cnpm_test_module@0.0.2',
npm verb cli   '--verbose',
npm verb cli   '--registry=http://127.0.0.1:7001' ]
npm info using npm@1.3.11
npm info using node@v0.10.21
npm WARN package.json cnpm_test_module@0.0.2 No description
npm WARN package.json cnpm_test_module@0.0.2 No repository field.
npm verb cache add [ 'cnpm_test_module@0.0.2', null ]
npm verb cache add name=undefined spec="cnpm_test_module@0.0.2" args=["cnpm_test_module@0.0.2",null]
npm verb parsed url { protocol: null,
npm verb parsed url   slashes: null,
npm verb parsed url   auth: null,
npm verb parsed url   host: null,
npm verb parsed url   port: null,
npm verb parsed url   hostname: null,
npm verb parsed url   hash: null,
npm verb parsed url   search: null,
npm verb parsed url   query: null,
npm verb parsed url   pathname: 'cnpm_test_module@0.0.2',
npm verb parsed url   path: 'cnpm_test_module@0.0.2',
npm verb parsed url   href: 'cnpm_test_module@0.0.2' }
npm verb cache add name="cnpm_test_module" spec="0.0.2" args=["cnpm_test_module","0.0.2"]
npm verb parsed url { protocol: null,
npm verb parsed url   slashes: null,
npm verb parsed url   auth: null,
npm verb parsed url   host: null,
npm verb parsed url   port: null,
npm verb parsed url   hostname: null,
npm verb parsed url   hash: null,
npm verb parsed url   search: null,
npm verb parsed url   query: null,
npm verb parsed url   pathname: '0.0.2',
npm verb parsed url   path: '0.0.2',
npm verb parsed url   href: '0.0.2' }
npm verb addNamed [ 'cnpm_test_module', '0.0.2' ]
npm verb addNamed [ '0.0.2', '0.0.2' ]
npm verb lock cnpm_test_module@0.0.2 /Users/deadhorse/.npm/b21ef9d1-cnpm-test-module-0-0-2.lock
npm verb url raw cnpm_test_module/0.0.2
npm verb url resolving [ 'http://127.0.0.1:7001/', './cnpm_test_module/0.0.2' ]
npm verb url resolved http://127.0.0.1:7001/cnpm_test_module/0.0.2
npm info trying registry request attempt 1 at 00:24:56
npm http GET http://127.0.0.1:7001/cnpm_test_module/0.0.2
npm http 200 http://127.0.0.1:7001/cnpm_test_module/0.0.2
npm verb lock http://127.0.0.1:7001/dist/cnpm_test_module-0.0.2.tgz /Users/deadhorse/.npm/9491a1c3--dist-cnpm-test-module-0-0-2-tgz.lock
npm verb addRemoteTarball [ 'http://127.0.0.1:7001/dist/cnpm_test_module-0.0.2.tgz',
npm verb addRemoteTarball   '736749425bfa2744d7e979c5c3811a40aa0bee46' ]
npm info retry fetch attempt 1 at 00:24:58
npm verb fetch to= /var/folders/dq/l10_0k995hng87tqhb0yv7980000gn/T/npm-74764-ABC-9HIl/1386260698308-0.8871626160107553/tmp.tgz
npm http GET http://127.0.0.1:7001/dist/cnpm_test_module-0.0.2.tgz
npm http 200 http://127.0.0.1:7001/dist/cnpm_test_module-0.0.2.tgz
npm verb tar unpack /var/folders/dq/l10_0k995hng87tqhb0yv7980000gn/T/npm-74764-ABC-9HIl/1386260698308-0.8871626160107553/tmp.tgz
npm verb lock tar:///var/folders/dq/l10_0k995hng87tqhb0yv7980000gn/T/npm-74764-ABC-9HIl/1386260698308-0.8871626160107553/package /Users/deadhorse/.npm/eaeecb32-98308-0-8871626160107553-package.lock
npm verb lock tar:///var/folders/dq/l10_0k995hng87tqhb0yv7980000gn/T/npm-74764-ABC-9HIl/1386260698308-0.8871626160107553/tmp.tgz /Users/deadhorse/.npm/f1d96c9e-98308-0-8871626160107553-tmp-tgz.lock
npm verb tar pack [ '/Users/deadhorse/.npm/cnpm_test_module/0.0.2/package.tgz',
npm verb tar pack   '/var/folders/dq/l10_0k995hng87tqhb0yv7980000gn/T/npm-74764-ABC-9HIl/1386260698308-0.8871626160107553/package' ]
npm verb tarball /Users/deadhorse/.npm/cnpm_test_module/0.0.2/package.tgz
npm verb folder /var/folders/dq/l10_0k995hng87tqhb0yv7980000gn/T/npm-74764-ABC-9HIl/1386260698308-0.8871626160107553/package
npm verb lock tar:///var/folders/dq/l10_0k995hng87tqhb0yv7980000gn/T/npm-74764-ABC-9HIl/1386260698308-0.8871626160107553/package /Users/deadhorse/.npm/eaeecb32-98308-0-8871626160107553-package.lock
npm verb lock tar:///Users/deadhorse/.npm/cnpm_test_module/0.0.2/package.tgz /Users/deadhorse/.npm/2383be34-pm-test-module-0-0-2-package-tgz.lock
npm verb lock /Users/deadhorse/.npm/cnpm_test_module/0.0.2/package /Users/deadhorse/.npm/058ed2f2-m-cnpm-test-module-0-0-2-package.lock
npm verb tar unpack /Users/deadhorse/.npm/cnpm_test_module/0.0.2/package.tgz
npm verb lock tar:///Users/deadhorse/.npm/cnpm_test_module/0.0.2/package /Users/deadhorse/.npm/77183133-m-cnpm-test-module-0-0-2-package.lock
npm verb lock tar:///Users/deadhorse/.npm/cnpm_test_module/0.0.2/package.tgz /Users/deadhorse/.npm/2383be34-pm-test-module-0-0-2-package-tgz.lock
npm verb chmod /Users/deadhorse/.npm/cnpm_test_module/0.0.2/package.tgz 644
npm verb chown /Users/deadhorse/.npm/cnpm_test_module/0.0.2/package.tgz [ 501, 20 ]
npm info install cnpm_test_module@0.0.2 into /Users/deadhorse/git/install
npm info installOne cnpm_test_module@0.0.2
npm info /Users/deadhorse/git/install/node_modules/cnpm_test_module unbuild
npm info preuninstall cnpm_test_module@0.0.2
npm info uninstall cnpm_test_module@0.0.2
npm verb true,/Users/deadhorse/git/install/node_modules,/Users/deadhorse/git/install/node_modules unbuild cnpm_test_module@0.0.2
npm info postuninstall cnpm_test_module@0.0.2
npm verb tar unpack /Users/deadhorse/.npm/cnpm_test_module/0.0.2/package.tgz
npm verb lock tar:///Users/deadhorse/git/install/node_modules/cnpm_test_module /Users/deadhorse/.npm/9356c996-ll-node-modules-cnpm-test-module.lock
npm verb lock tar:///Users/deadhorse/.npm/cnpm_test_module/0.0.2/package.tgz /Users/deadhorse/.npm/2383be34-pm-test-module-0-0-2-package-tgz.lock
npm info preinstall cnpm_test_module@0.0.2
npm verb readDependencies using package.json deps
npm verb readDependencies using package.json deps
npm verb about to build /Users/deadhorse/git/install/node_modules/cnpm_test_module
npm info build /Users/deadhorse/git/install/node_modules/cnpm_test_module
npm verb linkStuff [ false,
npm verb linkStuff   false,
npm verb linkStuff   false,
npm verb linkStuff   '/Users/deadhorse/git/install/node_modules' ]
npm info linkStuff cnpm_test_module@0.0.2
npm verb linkBins cnpm_test_module@0.0.2
npm verb linkMans cnpm_test_module@0.0.2
npm verb rebuildBundles cnpm_test_module@0.0.2
npm info install cnpm_test_module@0.0.2
npm info postinstall cnpm_test_module@0.0.2
cnpm_test_module@0.0.2 node_modules/cnpm_test_module
npm verb exit [ 0, true ]
npm info ok
```