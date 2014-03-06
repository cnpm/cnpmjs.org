TESTS = $(shell ls -S `find test -type f -name "*.test.js" -print`)
REPORTER = tap
TIMEOUT = 30000
MOCHA_OPTS =

install:
	@npm install --registry=http://registry.cnpmjs.org \
		--disturl=http://cnpmjs.org/dist

jshint:
	@./node_modules/.bin/jshint ./

test:
	@NODE_ENV=test node --harmony \
		node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha \
		-- -u exports \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)
	@-$(MAKE) check-coverage

test-dev: install
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--harmony-generators \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		$(MOCHA_OPTS) \
		$(TESTS)

check-coverage:
	@./node_modules/.bin/istanbul check-coverage \
		--statements 100 \
		--functions 100 \
		--branches 100 \
		--lines 100

cov:
	@./node_modules/.bin/cov coverage

contributors:
	@./node_modules/.bin/contributors -f plain -o AUTHORS

autod:
	@./node_modules/.bin/autod -w -e public,view,docs,backup,coverage
	@$(MAKE) install

.PHONY: test
