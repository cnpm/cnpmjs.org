cnpmjs.org
=======

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: http://cnpmjs.org/badge/v/cnpmjs.org.svg?style=flat-square
[npm-url]: http://cnpmjs.org/package/cnpmjs.org
[travis-image]: https://img.shields.io/travis/cnpm/cnpmjs.org.svg?style=flat-square
[travis-url]: https://travis-ci.org/cnpm/cnpmjs.org
[codecov-image]: https://codecov.io/gh/cnpm/cnpmjs.org/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/cnpm/cnpmjs.org
[david-image]: https://img.shields.io/david/cnpm/cnpmjs.org.svg?style=flat-square
[david-url]: https://david-dm.org/cnpm/cnpmjs.org
[snyk-image]: https://snyk.io/test/npm/cnpmjs.org/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/cnpmjs.org
[download-image]: https://img.shields.io/npm/dm/cnpmjs.org.svg?style=flat-square
[download-url]: https://npmjs.org/package/cnpmjs.org

![logo](https://raw.github.com/cnpm/cnpmjs.org/master/logo.png)

## What is this?

Private npm registry and web for Enterprise, base on [koa](http://koajs.com/),
MySQL and [Simple Store Service](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide).

Our goal is to provide a low cost maintenance and easy to use solution for private npm.

## What can you do with `cnpmjs.org`

* Build a private npm for your own enterprise. ([alibaba](http://www.alibaba.com/) is using `cnpmjs.org` now)
* Build a mirror NPM. (we use it to build a mirror in China: [cnpmjs.org](http://cnpmjs.org/))
* Build a completely independent NPM registry to store whatever you like.

## Features

* **Support "scoped" packages**: [npm/npm#5239](https://github.com/npm/npm/issues/5239)
* **Support [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing)**
* **Simple to deploy**: only need `mysql` and a [simple store system](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide).
You can get the source code through `npm` or `git`.
* **Low cost and easy maintenance**: `package.json` info store in MySQL, MariaDB, SQLite or PostgreSQL databases,
tarball(tgz file) store in CDN or other store systems.
* **Automatic synchronization**: automatic synchronization from any registry specified, support two sync modes:
  - Sync all modules from a specified registry, like [npm registry](http://registry.npmjs.org).
  - Only sync the modules that exists in your own registry.
* **Manual synchronization**: automatic synchronization may has little delay, but you can syn immediately by manually.
* **Customized client**: we provide a client [cnpm](https://github.com/cnpm/cnpm)
to extend `npm` with more features(`sync` command, [gzip](https://github.com/npm/npm-registry-client/pull/40) support).
And it easy to wrap for your own registry which build with `cnpmjs.org`.
* **Compatible with NPM client**: you can use the origin NPM client with `cnpmjs.org`,
only need to change the registry in config. Even include manual synchronization (through `install` command).
* **Version badge**: base on [shields.io](http://shields.io/) ![cnpm-badge](http://cnpmjs.org/badge/v/cnpmjs.org.svg?style=flat-square)
* **Support http_proxy**: if you're behind firewall, need to request through http proxy

**PROTIP** Be sure to read [Migrating from 1.x to 2.x](https://github.com/cnpm/cnpmjs.org/wiki/Migrating-from-1.x-to-2.x)
as well as [New features in 2.x](https://github.com/cnpm/cnpmjs.org/wiki/New-features-in-2.x).

## Getting Start

* [Deploy a private npm registry in 5 minutes](https://github.com/cnpm/cnpmjs.org/wiki/Deploy-a-private-npm-registry-in-5-minutes)
* @[dead-horse](https://github.com/dead-horse): [What is cnpm?](http://deadhorse.me/slides/cnpmjs.html)
* install and deploy cnpmjs.org through npm: [examples](https://github.com/cnpm/custom-cnpm-example)
* Mirror NPM in China: [cnpmjs.org](http://cnpmjs.org)
* cnpm client: [cnpm](https://github.com/cnpm/cnpm), `npm install -g cnpm`
* [How to deploy cnpmjs.org](https://github.com/cnpm/cnpmjs.org/wiki/Deploy)
* [Sync packages through `http_proxy`](https://github.com/cnpm/cnpmjs.org/wiki/Sync-packages-through-http_proxy)
* [wiki](https://github.com/cnpm/cnpmjs.org/wiki)

## Develop on your local machine

### Dependencies

* [node](http://nodejs.org) >= 4.3.1
* Databases: only required one type
  * [sqlite3](https://npm.taobao.org/package/sqlite3) >= 3.0.2, we use `sqlite3` by default
  * [MySQL](http://dev.mysql.com/downloads/) >= 0.5.0, include `mysqld` and `mysql cli`. I test on `mysql@5.6.16`.
  * MariaDB
  * PostgreSQL

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

# update dependencies
$ make autod

# start server with development mode
$ make dev
```

### Dockerized cnpmjs.org Installation Guide

Cnpmjs.org shipped with a simple but pragmatic Docker Compose configuration.With the configuration, you can set up a MySQL backed cnpmjs.org instance by executing just one command on Docker installed environment.

#### Preparation

* [Install Docker](https://www.docker.com/community-edition)
* [Install Docker Compose](https://docs.docker.com/compose/install/) (Docker for Mac, Docker for Windows include Docker Compose, so most Mac and Windows users do not need to install Docker Compose separately)
* (Optional) Speed up Docker images downloading by setting up [Docker images download accelerator](https://yq.aliyun.com/articles/29941)


#### Dockerized cnpmjs.org control command 

Make sure your current working directory is the root of this GitHub repository.

##### Run dockerized cnpmjs.org

```bash
 $docker-compose up
 ```
 
This command will build a Docker image using the current code of repository. Then set up a dockerized MySQL instance with data initialized. After Docker container running, you can access your cnpmjs.org web portal at http://127.0.0.1:7002 and npm register at http://127.0.0.1:7001.

#### Run cnpmjs.org in the backend

```bash
$docker-compose up -d
```

#### Rebuild cnpmjs.org Docker image

```bash
$docker-compose build
```

#### Remove current dockerized cnpmjs.org instance

The current configuration set 2 named Docker Volume for your persistent data. If you haven't change the repository directory name, them will be "cnpmjsorg_cnpm-files-volume" & "cnpmjsorg_cnpm-db-volume".

Be Careful, the following commands will remove them.

```bash
$docker-compose rm 
$docker volume rm cnpmjsorg_cnpm-files-volume
$docker volume rm cnpmjsorg_cnpm-db-volume
```

You can get more information about your data volumes using the below commands:

```bash
$docker volume ls  // list all of your Docker volume
$docker volume inspect cnpmjsorg_cnpm-files-volume
$docker volume inspect cnpmjsorg_cnpm-db-volume
```

## How to contribute

* Clone the project
* Checkout a new branch
* Add new features or fix bugs in the new branch
* Make a pull request and we will review it ASAP

Tips: make sure your code is following the [node-style-guide](https://github.com/felixge/node-style-guide).

## Sponsors

- [![阿里云](https://static.aliyun.com/images/www-summerwind/logo.gif)](http://click.aliyun.com/m/4288/) (2016.2 - now)
- [![UCloud云计算](https://www.ucloud.cn/static/style/images/about/logo.png)](http://www.ucloud.cn?sem=sdk-CNPMJS) (2015.3 - 2016.3)

## License

[MIT](LICENSE.txt)
