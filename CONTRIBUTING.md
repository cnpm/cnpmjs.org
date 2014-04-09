# How to contribute

Third-party patches are essential for keeping `cnpmjs.org` great.
We want to keep it as easy as possible to contribute changes that
get things working in your environment. There are a few guidelines that we
need contributors to follow so that we can have a chance of keeping on
top of things.

## Getting Started

* Make sure you have a [GitHub account](https://github.com/signup/free)
* Fork the repository on GitHub

## Making Changes

* Create a topic branch from where you want to base your work.
  * This is usually the master branch.
  * Only target release branches if you are certain your fix must be on that
    branch.
  * To quickly create a topic branch based on master.
    Please avoid working directly on the `master` branch.
* Make commits of logical units and including unit tests.
* Check for unnecessary whitespace with `git diff --check` before committing.
* Make sure your commit messages are in the proper format.
* Make sure you have added the necessary tests for your changes.
* Run _all_ the tests to assure nothing else was accidentally broken.
* Follow [node style guide](https://github.com/felixge/node-style-guide)

## Submitting Changes

* Push your changes to a topic branch in your fork of the repository.
* Submit a pull request.
* Make sure travis-ci test pass.

# Additional Resources

* [General GitHub documentation](http://help.github.com/)
* [GitHub pull request documentation](http://help.github.com/send-pull-requests/)
* [cnpmjs.org](http://cnpmjs.org)
