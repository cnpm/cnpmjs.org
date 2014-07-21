cnpmjs.org
=======

[![Build Status](https://secure.travis-ci.org/cnpm/cnpmjs.org.svg)](http://travis-ci.org/cnpm/cnpmjs.org) [![Dependency Status](https://gemnasium.com/cnpm/cnpmjs.org.svg)](https://gemnasium.com/cnpm/cnpmjs.org)

[![NPM](https://nodei.co/npm/cnpmjs.org.svg?downloads=true&stars=true)](https://nodei.co/npm/cnpmjs.org/)

![logo](https://raw.github.com/cnpm/cnpmjs.org/master/logo.png)

## What is this?

Private npm registry and web for Enterprise, base on [koa](http://koajs.com/),
MySQL and [Simple Store Service](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide).

Our goal is to provide a low cost maintenance and easy to use solution for private npm.

## What can you do with `cnpmjs.org`

* Build a private npm for your own enterprise. ([alibaba](http://www.alibaba.com/) is using `cnpmjs.org` now)
* Build a mirror NPM. (we use it to build a mirror in China: [cnpmjs.org](http://cnpmjs.org/))
* Build a completely independent NPM registry to store whatever you like.

### Features

* **Support "scoped" packages**: [npm/npm#5239](https://github.com/npm/npm/issues/5239)
* **Simple to deploy**: only need `mysql` and a [simple store system](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide).
You can get the source code through `npm` or `git`.
* **Low cost and easy maintenance**: `package.json` info store in MySQL, tarball(tgz file) store in CDN or other store systems.
* **Automatic synchronization**: automatic synchronization from any registry specified, support two sync modes:
  - Sync all modules from a specified registry, like [npm registry](http://registry.npmjs.org).
  - Only sync the modules that exists in your own registry.
* **Manual synchronization**: automatic synchronization may has little delay, but you can syn immediately by manually.
* **Customized client**: we provide a client [cnpm](https://github.com/cnpm/cnpm)
to extend `npm` with more features(`sync` command, [gzip](https://github.com/npm/npm-registry-client/pull/40) support).
And it easy to wrap for your own registry which build with `cnpmjs.org`.
* **Compatible with NPM client**: you can use the origin NPM client with `cnpmjs.org`,
only need to change the registry in config. Even include manual synchronization (through `install` command).

## Getting Start

* @[dead-horse](https://github.com/dead-horse): [What is cnpm?](http://deadhorse.me/slides/cnpmjs.html)
* install and deploy cnpmjs.org through npm: [examples](https://github.com/cnpm/custom-cnpm-example)
* Mirror NPM in China: [cnpmjs.org](http://cnpmjs.org)
* cnpm client: [cnpm](https://github.com/cnpm/cnpm), `npm install -g cnpm`
* [How to deploy cnpmjs.org](https://github.com/cnpm/cnpmjs.org/wiki/Deploy)
* [NFS guide](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide)

![cnpm](https://docs.google.com/drawings/d/12QeQfGalqjsB77mRnf5Iq5oSXHCIUTvZTwECMonqCmw/pub?w=480&h=360)

## Develop on your local machine

### Dependencies

* [node](http://nodejs.org) =0.11.12
* [mysql](http://dev.mysql.com/downloads/) >= 0.5.0, include `mysqld` and `mysql cli`. I test on `mysql@5.6.16`.

### Start MySQL

```bash
$ nohup mysqld &
```

### Clone codes and run test

```bash
# clone from git
$ git clone https://github.com/cnpm/cnpmjs.org.git

# install dependencies
$ make install

# test
$ make test

# coverage
$ make test-cov

# udpate dependencies
$ make autod

# start server
$ node --harmony_generators dispatch.js
```

## How to contribute

* Clone the project
* Checkout a new branch
* Add new features or fix bugs in the new branch
* Make a pull request and we will review it ASAP

Tips: make sure your code is following the [node-style-guide](https://github.com/felixge/node-style-guide).

## Authors

```bash
$ git summary

 project  : cnpmjs.org
 repo age : 4 months ago
 commits  : 472
 active   : 167 days
 files    : 104
 authors  :
   272  fengmk2                 57.6%
   195  dead_horse              41.3%
     2  4simple                 0.4%
     2  Stanley Zheng           0.4%
     1  Alsotang                0.2%
```

## License

(The MIT License)

Copyright(c) cnpmjs.org and other contributors.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
