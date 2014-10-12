TESTS = $(shell ls -S `find test -type f -name "*.test.js" -print`)
REPORTER = spec
TIMEOUT = 30000
MOCHA_OPTS =
REGISTRY = --registry=https://registry.npm.taobao.org
DB = sqlite

install:
	@npm install $(REGISTRY) \
		--disturl=https://npm.taobao.org/dist

jshint: install
	@-./node_modules/.bin/jshint ./

pretest-mysql:
	@mysql -uroot -e 'DROP DATABASE IF EXISTS cnpmjs_test;'
	@mysql -uroot -e 'CREATE DATABASE cnpmjs_test;'
	@mysql -uroot 'cnpmjs_test' -e 'show tables;'

pretest:
	@node --harmony test/init_db.js

test: install pretest
	@NODE_ENV=test DB=${DB} ./node_modules/.bin/mocha \
		--harmony \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		--require should-http \
		--require co-mocha \
		--require ./test/init.js \
		$(MOCHA_OPTS) \
		$(TESTS)

test-sqlite:
	@$(MAKE) test DB=sqlite

test-mysql: pretest-mysql
	@$(MAKE) test DB=mysql

test-all: test-sqlite test-mysql

test-cov cov: install
	@NODE_ENV=test DB=${DB} node --harmony \
		node_modules/.bin/istanbul cover --preserve-comments \
		./node_modules/.bin/_mocha \
		-- -u exports \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		--require should-http \
		--require co-mocha \
		--require ./test/init.js \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov-sqlite:
	@$(MAKE) test-cov DB=sqlite

test-cov-mysql: pretest-mysql
	@$(MAKE) test-cov DB=mysql

test-travis: install
	@NODE_ENV=test DB=${DB} CNPM_SOURCE_NPM=https://registry.npmjs.org CNPM_SOURCE_NPM_ISCNPM=false \
		node --harmony \
		node_modules/.bin/istanbul cover --preserve-comments \
		./node_modules/.bin/_mocha \
		--report lcovonly \
		-- \
		--reporter dot \
		--timeout $(TIMEOUT) \
		--require should \
		--require should-http \
		--require co-mocha \
		--require ./test/init.js \
		$(MOCHA_OPTS) \
		$(TESTS)

test-travis-sqlite:
	@$(MAKE) test-travis DB=sqlite

test-travis-mysql: pretest-mysql
	@$(MAKE) test-travis DB=mysql

test-travis-all: test-travis-sqlite test-travis-mysql

dev:
	@node_modules/.bin/node-dev --harmony dispatch.js

contributors: install
	@./node_modules/.bin/contributors -f plain -o AUTHORS

autod: install
	@./node_modules/.bin/autod -w \
		--prefix "~" \
		--exclude public,view,docs,backup,coverage \
		--dep bluebird,mysql \
		--devdep mocha,should,istanbul-harmony,jshint
	@$(MAKE) install

.PHONY: test
