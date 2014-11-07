
2.0.0-beta1 / 2014-11-07
==================

 * refactor(sync_worker): only sync request need to sync upstream first
 * fix(sync_worker): make sure end event will emit
 * fix: mv readme.md script to public/js/readme.js
 * fix(sync): hotfix co uncaughtException
 * feat(sync): sync python dist
 * pin autod@1
 * remove useless comment
 * refactor models/_module_maintainer_class_methods.js

2.0.0-beta0 / 2014-11-02
==================

 * ungrade koa-markdown to use remarkable, close #482
 * fix(module_log): limit module sync log size to 1MB
 * refactor(config): remove adaptScope config key
 * chore(Makefile): $ make install-production
 * fix(sequelize): show warnning message when using old config.js
 * docs(readme): Migrating from 1.x to 2.x
 * feat(sync): add min sync interval time detect
 * refactor(dispatch): remove unused codes
 * use sequelize to connect database

1.7.1 / 2014-10-15
==================

  * fix typo in sync popular, fix [#477](https://github.com/cnpm/cnpmjs.org/issues/477)

1.7.0 / 2014-10-15
==================

  * Merge pull request [#475](https://github.com/cnpm/cnpmjs.org/issues/475) from KidkArolis/configurable-short-registry-url
  * If sourceNpmRegistry is cnpm - use it in getShort
  * Merge pull request [#472](https://github.com/cnpm/cnpmjs.org/issues/472) from cnpm/issue468-upon
  * fix test label
  * add sync popular modules, close [#468](https://github.com/cnpm/cnpmjs.org/issues/468)
  * add sendmail test script

1.6.1 / 2014-10-09
==================

 * make test on travis faster
 * ensure not sync user also has his own package names
 * add [v1.6.x-upgrade.sql](https://github.com/cnpm/cnpmjs.org/blob/master/docs/update_sqls/v1.6.x-upgrade.sql)
 * save npm original package maintainers to npm_module_maintainer table. fixed [#464](https://github.com/cnpm/cnpmjs.org/issues/464)
 * use simple 404

1.6.0 / 2014-10-08
==================

 * list user all packages api. fixed [#462](https://github.com/cnpm/cnpmjs.org/issues/462)
 * add node-dev: $ make dev
 * always start sync worker
 * update node mailer
 * update autod

1.5.5 / 2014-09-25
==================

 * fix sync in web
 * sync upstream only the first package. make sync devDependencies optionsal, default is false
 * add some comment, default sourceNpmRegistryIsCNpm to true

1.5.4 / 2014-09-24
==================

 * format sync log

1.5.3 / 2014-09-24
==================

 * support sync upstream first. fixed [#451](https://github.com/cnpm/cnpmjs.org/issues/451)

1.5.2 / 2014-09-24
==================

 * support im url on user profile page; update bootstrap to 3.2.0

1.5.1 / 2014-09-23
==================

  * search support case insensitive, close [#450](https://github.com/cnpm/cnpmjs.org/issues/450)
  * add config._syncInWeb, close [#448](https://github.com/cnpm/cnpmjs.org/issues/448)
  * show maintainers when publish 403. fixed [#430](https://github.com/cnpm/cnpmjs.org/issues/430)
  * no attachment for html

1.5.0 / 2014-09-15
==================

  * dist sync document too. fixed [#420](https://github.com/cnpm/cnpmjs.org/issues/420)

1.4.4 / 2014-09-12
==================

  * badge version support 1.0.0-beta1. fixed [#440](https://github.com/cnpm/cnpmjs.org/issues/440)

1.4.3 / 2014-09-09
==================

  * alias /:name/-/:file to /:name/download/:file. fixed [#439](https://github.com/cnpm/cnpmjs.org/issues/439)

1.4.2 / 2014-09-03
==================

  * change default source registry to taobao's registry
  * Merge pull request [#435](https://github.com/cnpm/cnpmjs.org/issues/435) from cnpm/bluebird
  * add bluebird
  * bump fs-cnpm
  * Merge pull request [#434](https://github.com/cnpm/cnpmjs.org/issues/434) from cnpm/agent-stat
  * show agent sockets stat. fixed [#433](https://github.com/cnpm/cnpmjs.org/issues/433)
  * update readme
  * remove pic in readme

1.4.1 / 2014-08-20
==================

  * fix login error status

1.4.0 / 2014-08-20
==================

 * different version, different color badge, add version badge. fixed [#427](https://github.com/cnpm/cnpmjs.org/issues/427)
 * add download and node version badge

1.3.2 / 2014-08-18
==================

  * remove unused eventproxy
  * add custom config in tools/sync_not_exist.js

1.3.1 / 2014-08-18
==================

  * add sync not exist tools, close [#424](https://github.com/cnpm/cnpmjs.org/issues/424)
  * use gittip instand of alipay. close [#425](https://github.com/cnpm/cnpmjs.org/issues/425)
  * update registry api doc

1.3.0 / 2014-08-11
==================

  * ignore config/config.js
  * Merge pull request [#421](https://github.com/cnpm/cnpmjs.org/issues/421) from cnpm/qn-cnpm
  * fix test case
  * use fs-cnpm
  * fix test
  * use qn-cnpm
  * bump cfork

1.2.2 / 2014-08-08
==================

  * bump koa

1.2.1 / 2014-08-07
==================

 * deprecated bug fix and support undeprecate

1.2.0 / 2014-08-07
==================

 * show deprecated message
 * Sync deprecated field if it missing
 * Support $ cnpm deprecate [pkgname]@[version] "message". fixed [#415](https://github.com/cnpm/cnpmjs.org/issues/415)

1.1.0 / 2014-08-07
==================

 * Add user to maintainers when publish. fixed [#395](https://github.com/cnpm/cnpmjs.org/issues/395)
 * List all npm registry api. close [#413](https://github.com/cnpm/cnpmjs.org/issues/413)
 * limit list since
 * change deps by "~"
 * use cfork to make sure worker fork and restart
 * handle master uncaughtException. fixed [#403](https://github.com/cnpm/cnpmjs.org/issues/403)

1.0.6 / 2014-08-02
==================

 * WTF moment@2.8.0 missing

1.0.5 / 2014-08-02
==================

 * unpublish pkg@version bug hotfix. fixed [#400](https://github.com/cnpm/cnpmjs.org/issues/400)

1.0.4 / 2014-08-01
==================

 * hotfix [#399](https://github.com/cnpm/cnpmjs.org/issues/399) use not exists

1.0.3 / 2014-08-01
==================

 * add maintaining packages in user page

1.0.2 / 2014-08-01
==================

  * ~_~ fix auth error response message

1.0.1 / 2014-08-01
==================

  * Merge pull request [#398](https://github.com/cnpm/cnpmjs.org/issues/398) from cnpm/fix-auth
  * hot fix auth error

1.0.0 / 2014-08-01
==================

 * add private package list

0.9.2 / 2014-07-30
==================

 * hotfix save custom user bug

0.9.1 / 2014-07-30
==================

 * Handle user service auth throw custom error message
 * add test for config private packages
 * add config.privatePackages
 * add more comments in config/index.js

0.9.0 / 2014-07-29
==================

 * scopes init mv to services/user.js
 * show user more profile
 * registry show user support custom user service
 * support custom user service for user auth
 * remove session middleware
 * add DefaultUserService
 * check scopes in module.getAdapt
 * test public mode, fix some logic, close [#382](https://github.com/cnpm/cnpmjs.org/issues/382)
 * move scope.js into publishable.js, add forcePublishWithScope
 * config.scopes not exist, means do not support scope
 * add assert scope middleware

0.8.7 / 2014-07-24
==================

 * fix unpublished info missing maintainers cause TypeError

0.8.6 / 2014-07-23
==================

 * show unpublished info on web package page. fixes [#381](https://github.com/cnpm/cnpmjs.org/issues/381)

0.8.5 / 2014-07-22
==================

 * Only private package support default scoped. fixed [#378](https://github.com/cnpm/cnpmjs.org/issues/378)

0.8.4 / 2014-07-22
==================

 * adapt default scpoe in /@:scope/:name/:version

0.8.3 / 2014-07-22
==================

 * hot fix download

0.8.2 / 2014-07-22
==================

 * fix default scope detect

0.8.1 / 2014-07-21
==================

 * add more test cases
 * support default @org. close [#376](https://github.com/cnpm/cnpmjs.org/issues/376)
 * hotfix redis init error

0.8.0 / 2014-07-21
==================

 * support "scoped" packages. close [#352](https://github.com/cnpm/cnpmjs.org/issues/352)
 * use safe jsonp
 * Stop support old publish flow. fix [#368](https://github.com/cnpm/cnpmjs.org/issues/368)
 * update SQLs
 * use sync_info and sync_error categories
 * add categories to loggers. fix [#370](https://github.com/cnpm/cnpmjs.org/issues/370)
 * fix get latest tag always not exists bug
 * support `npm publish --tag beta`. fix [#366](https://github.com/cnpm/cnpmjs.org/issues/366)
 * use mini-logger and error-formater

0.7.0 / 2014-07-07
==================

 * use module_maintainers on GET /pakcage/:name page
 * use new module_maintainers on GET /:name
 * admin user should never publish to other user's packages. fix [#363](https://github.com/cnpm/cnpmjs.org/issues/363)
 * Add a new table for module-maintainers.
 * gravatar use https
 * support https

0.6.1 / 2014-06-18
==================

 * hot fix removeTagsByNames()
 * fix _rev not exists
 * sync unpublished on GET /sync/:name

0.6.0 / 2014-06-16
==================

 * sync unpublished info. close [#353](https://github.com/cnpm/cnpmjs.org/issues/353)
 * Delete not exists versions on sync worker. [#353](https://github.com/cnpm/cnpmjs.org/issues/353)

0.5.3 / 2014-06-13
==================

  * fix sync response 204
  * add links in History.md
  * bump koa
  * fix test-cov
  * bump koa and should

0.5.2 / 2014-06-04
==================

 * sync hotfix
 * sync phantomjs downloads pkg. close [#348](https://github.com/cnpm/cnpmjs.org/issues/348)
 * add restart, fixed [#346](https://github.com/cnpm/cnpmjs.org/issues/346)

0.5.1 / 2014-05-28
==================

 * fix attack on /-/all/since?stale=update_after&startkey=2 close [#336](https://github.com/cnpm/cnpmjs.org/issues/336)
 * bump thunkify-wrap
 * bump koa-middlewares
 * remove outputError
 * bump dependencies
 * use svg badge
 * add package/notfound page
 * add dist mirror link to home page
 * fix sync listdiff and add more test cases

0.5.0 / 2014-05-13
==================

 * filter /nightlies/*
 * use koa setter instead of set()
 * add more info on error email
 * add sync dist to sync/index.js
 * show dist page
 * sync dist file and save it to database
 * disable gzip before [#335](https://github.com/cnpm/cnpmjs.org/issues/335) has fix

0.4.3 / 2014-04-18
==================

  * Merge pull request [#334](https://github.com/cnpm/cnpmjs.org/issues/334) from cnpm/fix-permission
  * add permission check to /:name/:tag
  * Merge pull request [#333](https://github.com/cnpm/cnpmjs.org/issues/333) from cnpm/issue332-tag
  * fix space
  * add put /:name/:tag, close [#332](https://github.com/cnpm/cnpmjs.org/issues/332)

0.4.2 / 2014-04-17
==================

 * sync interval config
 * fix fav ico and show pkg size on pkg info page. fix [#318](https://github.com/cnpm/cnpmjs.org/issues/318)
 * sync work sync one done must wait for a defer.setImmediate. fix [#328](https://github.com/cnpm/cnpmjs.org/issues/328)
 * bump dep versions
 * if download tarball 404, throw err better than ignore it. fixed [#325](https://github.com/cnpm/cnpmjs.org/issues/325)
 * refator sync
 * hotfix, close [#321](https://github.com/cnpm/cnpmjs.org/issues/321)
 * hotfix, close [#319](https://github.com/cnpm/cnpmjs.org/issues/319)
 * support custom web home page
 * npm get short only can read from cnpm now
 * if using reverted proxy like nginx, only binding on local host
 * fix redis detect logic

0.4.1 / 2014-04-10
==================

 * fix sync status code error

0.4.0 / 2014-04-09
==================

 * fix test cases to run on local machine
 * add contribute guidelines
 * use local mysql for dev env. fix [#308](https://github.com/cnpm/cnpmjs.org/issues/308)
 * use copy to
 * use koa-compress and koa-conditional-get
 * maintainers is string, fix [#301](https://github.com/cnpm/cnpmjs.org/issues/301)

0.3.13 / 2014-03-27
==================

 * fix npm adduser update 409 bug
 * fix multiline coverage
 * show package engines. fixed [#280](https://github.com/cnpm/cnpmjs.org/issues/280)
 * dont sync local package field. fix [#295](https://github.com/cnpm/cnpmjs.org/issues/295)

0.3.12 / 2014-03-26
==================

 * fix result.successes not exist error
 * fix search list
 * add simple request for listall
 * only return package name in /-/all and /-/all/since, fixed [#291](https://github.com/cnpm/cnpmjs.org/issues/291)
 * refine docs foloder
 * use module gmt_modified as etag. fix [#288](https://github.com/cnpm/cnpmjs.org/issues/288)
 * fix typo, remove unused config in package.json
 * web page only list cnpm registry related info
 * use generator in qnfs

0.3.11 / 2014-03-20
==================

  * use common.isMaintainer, fixed [#283](https://github.com/cnpm/cnpmjs.org/issues/283)
  * update dependencies
  * use co-mocha for test, fixed [#279](https://github.com/cnpm/cnpmjs.org/issues/279)
  * update thunkify-wrap, breaking change in thunkify-wrap
  * refactor SQLs by using multiline
  * use multiline to refactor sqls
  * ignore contributors

0.3.10 / 2014-03-16
==================

  * Only /_session request send the authSession. fixed [#223](https://github.com/cnpm/cnpmjs.org/issues/223)
  * sync npm user info when maintainers and contributors not exists. fixed [#82](https://github.com/cnpm/cnpmjs.org/issues/82)
  * save npm user to mysql
  * password salt always be randoms
  * remove session access in /name and /name/version, fixed [#274](https://github.com/cnpm/cnpmjs.org/issues/274)
  * fix update maintainer session error
  * update koa-middlewares
  * fix test, fix sync_by_install
  * use defer session
  * Support npm owner|author add [name] [pkg]. fixed [#271](https://github.com/cnpm/cnpmjs.org/issues/271)

0.3.9 / 2014-03-14
==================

  * custom user-agent
  * use co-urllib instead of thunkify urllib; fix mock http.request test cases
  * request limit custom message
  * add config.redis check
  * add koa-limit, fixed [#267](https://github.com/cnpm/cnpmjs.org/issues/267)

0.3.8 / 2014-03-11
==================

  * update middlewares, fixed missing charset bug [#264](https://github.com/cnpm/cnpmjs.org/issues/264)

0.3.7 / 2014-03-11
==================

  * show worker die date time
  * update to koa@0.5.1
  * hotfix for star user
  * fix yield gather, sync missing deps even no missing versions
  * fix return versions
  * fix makefile, remove eventproxy
  * refactor sync_module_worker
  * add make test-dev, fixed [#259](https://github.com/cnpm/cnpmjs.org/issues/259)
  * change npm.js to generator
  * update urllib, proxy/npm.js use generator
  * sync_all and sync_exist to generator
  * change function to generator
  * need node >= v0.11.9

0.3.6 / 2014-03-06
==================

  * install missing package should sync it from source npm. fixed [#252](https://github.com/cnpm/cnpmjs.org/issues/252)
  * npm publish dont contains .jshint*
  * npm test run jshint
  * Add jshint check: $ make jshint
  * use `yield* next` instead of `yield next`
  * replace dist.u.qiniudn.com with cnpmjs.org/dist

0.3.5 / 2014-03-05
==================

  * redirect /dist/xxx.tgz => http://dist.u.qiniudn.com/xxx.tgz fixed [#249](https://github.com/cnpm/cnpmjs.org/issues/249)
  * redirect /name to /package/name when /name is 404. fixed [#245](https://github.com/cnpm/cnpmjs.org/issues/245)
  * Add missing properies and sync missing star users. fixed [#235](https://github.com/cnpm/cnpmjs.org/issues/235)

0.3.4 / 2014-03-04
==================

  * add cov
  * use istanbul run test coverage
  * gzip support. fix [#241](https://github.com/cnpm/cnpmjs.org/issues/241)
  * readme spelling patch (@stanzheng)
  * default readme to null, fixed [#233](https://github.com/cnpm/cnpmjs.org/issues/233)
  * remove readme in versions

0.3.3 / 2014-02-28
==================

  * Merge pull request [#232](https://github.com/cnpm/cnpmjs.org/issues/232) from cnpm/host-hotfix
  * get request host from request.headers
  * Merge pull request [#231](https://github.com/cnpm/cnpmjs.org/issues/231) from cnpm/bug-fix
  * fix deps display bug[#230](https://github.com/cnpm/cnpmjs.org/issues/230) and nsf.url TypeError[#229](https://github.com/cnpm/cnpmjs.org/issues/229)

0.3.2 / 2014-02-28
==================

  * update koa-sess and koa-redis
  * fix sync all test
  * remove nfs.downloadStream first, fix tmppath error
  * fix fengmk2/giturl[#1](https://github.com/cnpm/cnpmjs.org/issues/1) bug

0.3.1 / 2014-02-27
==================

  * add etag fixed [#224](https://github.com/cnpm/cnpmjs.org/issues/224)
  * travis ci install on source npm

0.3.0 / 2014-02-27
==================

  * fix typo and dont sync not exists pkgs
  * use koa-middlewares
  * fix signed cookie not work on npm@1.3.25; node --harmony-generators
  * fix opensearch test case
  * update koa bodyparser
  * logger.error(err) should send err stack email notice
  * json body parse limit and bug fix.
  * fix sync 404 reason not clear
  * all controllers to koa
  * controller/web/user.js to koa
  * change web connect to koa
  * use outputError
  * use yield exports.addPackageAndDist.call(this, next);
  * add end() when ws write end
  * fix yield coWrite
  * fix all the test of registry module.test.js
  * convert registry/module.js to koa type
  * fix auth middleware
  * finish registry user controller koa and update mm to support thunkify. fixed [#196](https://github.com/cnpm/cnpmjs.org/issues/196)
  * change controllers/user.js to koa
  * thunkify all proxy
  * convert all middlewares to koa type
  * change regsitry sync to koa
  * addd koa-jsonp, koa-bodyparser, fix / controller
  * first koa run registry home page /
  * Merge pull request [#212](https://github.com/cnpm/cnpmjs.org/issues/212) from cnpm/fix-sync-404
  * return friendly 404 reason
  * Merge pull request [#211](https://github.com/cnpm/cnpmjs.org/issues/211) from cnpm/bug-fix
  * override json limit to default 10mb. fixed [#209](https://github.com/cnpm/cnpmjs.org/issues/209)
  * fix [#210](https://github.com/cnpm/cnpmjs.org/issues/210) addPackageAndDist package version detect bug

0.2.27 / 2014-02-19
==================

  * support json result in search, fixed [#189](https://github.com/cnpm/cnpmjs.org/issues/189)

0.2.26 / 2014-02-19
==================

  * npm publish also need to add deps

0.2.25 / 2014-02-19
==================

  * max handle number of package.json `dependencies` property
  * Dependents support. fixed [#190](https://github.com/cnpm/cnpmjs.org/issues/190)

0.2.24 / 2014-02-13
==================

  * fix if delete all the versions
  * refactor remove module, fixed [#186](https://github.com/cnpm/cnpmjs.org/issues/186)

0.2.23 / 2014-01-26
==================

  * system admin can add, publish, remove the packages. fixed [#176](https://github.com/cnpm/cnpmjs.org/issues/176)

0.2.22 / 2014-01-26
==================

  * add keyword and search support keyword. [#181](https://github.com/cnpm/cnpmjs.org/issues/181)

0.2.21 / 2014-01-24
==================

  * refactor code styles on package.html
  * nav-tabs e.preventDefault
  * Show registry server error response. fixed [#178](https://github.com/cnpm/cnpmjs.org/issues/178)
  * nav-tabs for package.html (@4simple)

0.2.20 / 2014-01-23
==================

  * hotfix sync missing dependencies and readmes
  * fix sync readme error, fixed [#174](https://github.com/cnpm/cnpmjs.org/issues/174)
  * add updateReadme in module

0.2.19 / 2014-01-22
==================

  * npm install no need to check authorization header. fixed [#171](https://github.com/cnpm/cnpmjs.org/issues/171)

0.2.18 / 2014-01-20
==================

  * Support gitlab git url to display and click. fixed [#160](https://github.com/cnpm/cnpmjs.org/issues/160)
  * fix redis crash

0.2.17 / 2014-01-17
==================

  * custom logo url
  * hotfix layout bug

0.2.16 / 2014-01-16
==================

  * fix publish-time bug

0.2.15 / 2014-01-16
==================

  * add publish_time to debug

0.2.14 / 2014-01-16
==================

  * add make autod
  * update publish_time, fixed [#163](https://github.com/cnpm/cnpmjs.org/issues/163)

0.2.13 / 2014-01-15
==================

  * markdown tmpl not support footer, need to wrap on app start

0.2.12 / 2014-01-15
==================

  * add footer and npm client name customable

0.2.11 / 2014-01-15
==================

  * package page contributor link to search, default is true

0.2.10 / 2014-01-14
==================

  * fix [#155](https://github.com/cnpm/cnpmjs.org/issues/155) Content-Disposition wrong.

0.2.9 / 2014-01-14
==================

  * support startkey=c and startkey="c"
  * support couch db search api. fixed [#153](https://github.com/cnpm/cnpmjs.org/issues/153)
  * fix fork me image link
  * support sync by query.name

0.2.8 / 2014-01-14
==================

  * dont show err stack on test env
  * add download link for package page

0.2.7 / 2014-01-13
==================

  * add shasum when nfs.upload and hfs.uploadBuffer, fixed [#148](https://github.com/cnpm/cnpmjs.org/issues/148)

0.2.6 / 2014-01-13
==================

  * support custom session store, fixed [#146](https://github.com/cnpm/cnpmjs.org/issues/146)

0.2.5 / 2014-01-13
==================

  * add download timeout and unit test
  * use downloadStream() first
  * nfs download to a writeable stream.

0.2.4 / 2014-01-10
==================

  * set main script to  index.js, fixed [#142](https://github.com/cnpm/cnpmjs.org/issues/142)

0.2.3 / 2014-01-10
==================

  * Dont show sync button on private package
  * Sync package as publish with no deps. fixed [#138](https://github.com/cnpm/cnpmjs.org/issues/138)

0.2.2 / 2014-01-10
==================

  * keep compatibility
  * qnfs upload only callback a url
  * compat remove package
  * set tarball url
  * new npm publish in one request, add _publish_in_cnpm
  * support unsure name ufs
  * contributors maybe a object
  * Object #<Object> has no method 'forEach' fixed [#134](https://github.com/cnpm/cnpmjs.org/issues/134)
  * support custom config as a module, fixed issue [#132](https://github.com/cnpm/cnpmjs.org/issues/132)
  * support npm new publish flow. fixed [#129](https://github.com/cnpm/cnpmjs.org/issues/129)
  * add toString and constructor to test admin
  * fix [#119](https://github.com/cnpm/cnpmjs.org/issues/119) hasOwnProperty check admin bug.

0.2.0 / 2013-12-27
==================

  * remove to lower case
  * fix [#127](https://github.com/cnpm/cnpmjs.org/issues/127) execSync and execsync.
  * add contributors list on package page
  * mv blanket to config
  * sync typeerror fix #statusCode
  * add disturl
  * fix [#122](https://github.com/cnpm/cnpmjs.org/issues/122) admin security bug
  * fixed [#121](https://github.com/cnpm/cnpmjs.org/issues/121), let pkg 404 as success
  * fix sql insert error
  * fix typos

0.1.3 / 2013-12-20
==================

  * add favicon
  * Fix auth middleware bug (@alsotang)
  * make sure all packages name are lower case
  * select ids from tag
  * fix nodejsctl
  * fix [#112](https://github.com/cnpm/cnpmjs.org/issues/112) missing versions and time no sync
  * remove restart command
  * fix sync missing packages error
  * fix web/readme.md, add install
  * fix [#109](https://github.com/cnpm/cnpmjs.org/issues/109) pkg no times and no versions bug.

0.1.2 / 2013-12-19
==================

  * fix times not exists canot sync bug. fixed [#101](https://github.com/cnpm/cnpmjs.org/issues/101)
  * support npm run command
  * remove before_install and install in travis, fixed [#102](https://github.com/cnpm/cnpmjs.org/issues/102)
  * split all sub queries, fixed [#104](https://github.com/cnpm/cnpmjs.org/issues/104)
  * fix doc, fixed [#103](https://github.com/cnpm/cnpmjs.org/issues/103)
  * fix search too slow.
  * dont email sync log level info
  * only sync missing packages at first time
  * update dependencies
  * sync all will sync all the missing packages, fixed [#97](https://github.com/cnpm/cnpmjs.org/issues/97)

0.1.0 / 2013-12-12
==================

  * add sync title
  * add favicon. fixed [#69](https://github.com/cnpm/cnpmjs.org/issues/69)
  * refine sync page, fiexd [#70](https://github.com/cnpm/cnpmjs.org/issues/70)
  * add app version
  * add test for sync
  * refine sync page
  * registry and web all use controllers/sync.js
  * sync from web, fixed [#58](https://github.com/cnpm/cnpmjs.org/issues/58)
  * saving missing descriptions
  * add package download info. fixed [#63](https://github.com/cnpm/cnpmjs.org/issues/63)
  * add avatar
  * use dependecies, fixed #issue62
  * support open search, fixed [#60](https://github.com/cnpm/cnpmjs.org/issues/60)
  * make sure publish_time and author is same to source npm registry. fixed [#56](https://github.com/cnpm/cnpmjs.org/issues/56)
  * add test for search
  * add a simple search by mysql like
  * fix This version of MySQL doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery. fixed [#54](https://github.com/cnpm/cnpmjs.org/issues/54)
  * update install doc, use nodejsctl to start
  * must add limit on list by author sql
  * fix sql, change test to fit my local database, fixed [#46](https://github.com/cnpm/cnpmjs.org/issues/46)
  * use registry.cnpmjs.org
  * add install document and total package info on home page. fix [#42](https://github.com/cnpm/cnpmjs.org/issues/42)
  * add module_id to tag table. [#46](https://github.com/cnpm/cnpmjs.org/issues/46)
  * skip error version. fixed [#43](https://github.com/cnpm/cnpmjs.org/issues/43)
  * sync may make a user do not exist in database, but have modules in registry
  * add user page
  * fix set license
  * ignore 404 on sync. fixed [#39](https://github.com/cnpm/cnpmjs.org/issues/39)
  * fix module page, add test
  * update urllib to 0.5.5
  * version and tag
  * add module page
  * fix download url
  * first get tag, then try version
  * support sync triggle by install, finish [#31](https://github.com/cnpm/cnpmjs.org/issues/31)
  * addTag error return 500
  * just one download field
  * add download total info on home page
  * add download count
  * versions empty and also check missing tags
  * remove tags on unpublish
  * add module tag. fix [#6](https://github.com/cnpm/cnpmjs.org/issues/6)
  * add [done] flag to check sync done on client
  * get sync log [#29](https://github.com/cnpm/cnpmjs.org/issues/29)
  * fix test in module
  * rm tmp file on down request error
  * add time for debug str
  * fix pkg not exists null bug
  * use sync module woker to handle sync process. fixed [#19](https://github.com/cnpm/cnpmjs.org/issues/19)
  * if private mode enable, only admin can publish module
  * add alias in readme
  * fix sql, add sort by name
  * fix sql
  * add api to support npm search and auto completion
  * add npm and cnpm image
  * add registry total info on home page
  * fix mods bug in module.removeAll, change module.update => module.removeWithVersions
  * add test, fix bug. fixed [#18](https://github.com/cnpm/cnpmjs.org/issues/18)
  * spoort unpublish
  * add web page index readme
  * switchable nfs [#21](https://github.com/cnpm/cnpmjs.org/issues/21)
  * change file path to match npm file path
  * use qn cdn to store tarball file fixed [#16](https://github.com/cnpm/cnpmjs.org/issues/16)
  * add GET /:name/:version, fixed [#3](https://github.com/cnpm/cnpmjs.org/issues/3)
  * add module controller test cases; fix next module not exists logic bug.
  * publish module flow finish [#11](https://github.com/cnpm/cnpmjs.org/issues/11)
  * add test for controllers/registry/user.js
  * add test for middleware/auth
  * add test for proxy/user
  * remove index.js
  * fix typo
  * add redis as session store
  * fix nodejsctl mod
  * add start time
  * add home page
  * remove session controller
  * adduser() finish fixed [#5](https://github.com/cnpm/cnpmjs.org/issues/5)
  * rm app.js and routes.js
  * Mock npm adduser server response, fixing [#5](https://github.com/cnpm/cnpmjs.org/issues/5)
  * adjust project dir, separate registry and web server
  * Init rest frame for cnpmjs.org
  * init
