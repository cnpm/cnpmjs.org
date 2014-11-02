TESTS = $(shell ls -S `find test -type f -name "*.test.js" -print`)
REPORTER = spec
TIMEOUT = 30000
MOCHA_OPTS =
REGISTRY = --registry=https://registry.npm.taobao.org
DB = sqlite

install:
	@npm install --build-from-source $(REGISTRY) \
		--disturl=https://npm.taobao.org/dist

install-production production:
	@NODE_ENV=production $(MAKE) install

jshint: install
	@-node_modules/.bin/jshint ./

init-database:
	@node --harmony test/init_db.js

init-mysql:
	@mysql -uroot -e 'DROP DATABASE IF EXISTS cnpmjs_test;'
	@mysql -uroot -e 'CREATE DATABASE cnpmjs_test;'

test: install init-database
	@NODE_ENV=test DB=${DB} node_modules/.bin/mocha \
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

test-mysql: init-mysql
	@$(MAKE) test DB=mysql

test-all: test-sqlite test-mysql

test-cov cov: install init-database
	@NODE_ENV=test DB=${DB} node --harmony \
		node_modules/.bin/istanbul cover --preserve-comments \
		node_modules/.bin/_mocha \
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

test-cov-mysql: init-mysql
	@$(MAKE) test-cov DB=mysql

test-travis: install init-database
	@NODE_ENV=test DB=${DB} CNPM_SOURCE_NPM=https://registry.npmjs.org CNPM_SOURCE_NPM_ISCNPM=false \
		node --harmony \
		node_modules/.bin/istanbul cover --preserve-comments \
		node_modules/.bin/_mocha \
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

test-travis-mysql: init-mysql
	@$(MAKE) test-travis DB=mysql

test-travis-all: test-travis-sqlite test-travis-mysql

dev:
	@node_modules/.bin/node-dev --harmony dispatch.js

contributors: install
	@node_modules/.bin/contributors -f plain -o AUTHORS

autod: install
	@node_modules/.bin/autod -w \
		--prefix "~" \
		--exclude public,view,docs,backup,coverage \
		--dep bluebird,mysql \
		--keep should,supertest,should-http,chunkstream,mm,pedding
	@$(MAKE) install

.PHONY: test
