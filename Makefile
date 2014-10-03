TESTS = $(shell ls -S `find test -type f -name "*.test.js" -print`)
REPORTER = spec
TIMEOUT = 30000
MOCHA_OPTS =
REGISTRY = --registry=https://registry.npm.taobao.org

install:
	@npm install $(REGISTRY) \
		--disturl=https://npm.taobao.org/dist

jshint: install
	@-./node_modules/.bin/jshint ./

pretest:
	@mysql -uroot -e 'DROP DATABASE IF EXISTS cnpmjs_test;'
	@mysql -uroot -e 'CREATE DATABASE cnpmjs_test;'
	@mysql -uroot 'cnpmjs_test' < ./docs/db.sql
	@mysql -uroot 'cnpmjs_test' -e 'show tables;'
	@rm -rf .tmp/dist

test: install pretest
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--harmony \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		--require should-http \
		--require co-mocha \
		--require ./test/init.js \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov cov: install pretest
	@NODE_ENV=test node --harmony \
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

test-travis: install pretest
	@NODE_ENV=test node --harmony \
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

dev:
	@node_modules/.bin/node-dev --harmony dispatch.js

contributors: install
	@./node_modules/.bin/contributors -f plain -o AUTHORS

autod: install
	@./node_modules/.bin/autod -w \
		--prefix "~"\
		--exclude public,view,docs,backup,coverage \
		--dep bluebird \
		--devdep mocha,should,istanbul-harmony,jshint
	@$(MAKE) install

.PHONY: test
