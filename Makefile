TESTS = $(shell ls -S `find test -type f -name "*.test.js" -print`)
REPORTER = spec
TIMEOUT = 60000
MOCHA_OPTS =
DB = sqlite

jshint:
	@node_modules/.bin/jshint .

init-database:
	@NODE_ENV=test node test/init_db.js

init-mysql:
	@mysql -uroot -e 'DROP DATABASE IF EXISTS cnpmjs_test;'
	@mysql -uroot -e 'CREATE DATABASE cnpmjs_test;'

init-pg:
	@psql -c 'DROP DATABASE IF EXISTS cnpmjs_test;'
	@psql -c 'CREATE DATABASE cnpmjs_test;'

test: init-database
	@NODE_ENV=test DB=${DB} node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require intelli-espower-loader \
		--require should \
		--require thunk-mocha \
		--require ./test/init.js \
		$(MOCHA_OPTS) \
		$(TESTS)

test-sqlite:
	@$(MAKE) test DB=sqlite

test-mysql: init-mysql
	@$(MAKE) test DB=mysql

test-pg: init-pg
	@DB_PORT=5432 DB_USER=$(USER) $(MAKE) test DB=postgres

test-all: test-sqlite test-mysql

test-cov cov: init-database
	@NODE_ENV=test DB=${DB} node \
		node_modules/.bin/istanbul cover \
		node_modules/.bin/_mocha \
		-- -u exports \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require intelli-espower-loader \
		--require should \
		--require thunk-mocha \
		--require ./test/init.js \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov-sqlite:
	@$(MAKE) test-cov DB=sqlite

test-cov-mysql: init-mysql
	@$(MAKE) test-cov DB=mysql

test-travis: init-database
	@NODE_ENV=test DB=${DB} CNPM_SOURCE_NPM=https://registry.npmjs.com CNPM_SOURCE_NPM_ISCNPM=false \
		node \
		node_modules/.bin/istanbul cover \
		node_modules/.bin/_mocha \
		-- -u exports \
		--reporter dot \
		--timeout $(TIMEOUT) \
		--require intelli-espower-loader \
		--require should \
		--require thunk-mocha \
		--require ./test/init.js \
		$(MOCHA_OPTS) \
		$(TESTS)

test-travis-sqlite:
	@$(MAKE) test-travis DB=sqlite

test-travis-mysql: init-mysql
	@$(MAKE) test-travis DB=mysql

test-travis-pg:
	@psql -c 'DROP DATABASE IF EXISTS cnpmjs_test;' -U postgres
	@psql -c 'CREATE DATABASE cnpmjs_test;' -U postgres
	@DB_PORT=5432 DB_USER=postgres $(MAKE) test-travis DB=postgres

test-travis-all: jshint test-travis-sqlite test-travis-mysql test-travis-pg

dev:
	@NODE_ENV=development node node_modules/.bin/node-dev dispatch.js

contributors:
	@node_modules/.bin/contributors -f plain -o AUTHORS

autod:
	@node_modules/.bin/autod -w \
		--registry https://r.cnpmjs.org \
		--prefix "^" \
		--exclude public,view,docs,backup,coverage \
		--dep mysql \
		--keep should,supertest,chunkstream,mm,pedding

.PHONY: test
