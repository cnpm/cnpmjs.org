cnpmjs.org
=======

[![npm version][npm-image]][npm-url]
[![Node.js CI](https://github.com/cnpm/cnpmjs.org/actions/workflows/nodejs.yml/badge.svg)](https://github.com/cnpm/cnpmjs.org/actions/workflows/nodejs.yml)
[![Test coverage][codecov-image]][codecov-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fcnpm%2Fcnpmjs.org.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fcnpm%2Fcnpmjs.org?ref=badge_shield)

[npm-image]: http://cnpmjs.org/badge/v/cnpmjs.org.svg?style=flat-square
[npm-url]: http://cnpmjs.org/package/cnpmjs.org
[codecov-image]: https://codecov.io/gh/cnpm/cnpmjs.org/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/cnpm/cnpmjs.org
[snyk-image]: https://snyk.io/test/npm/cnpmjs.org/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/cnpmjs.org
[download-image]: https://img.shields.io/npm/dm/cnpmjs.org.svg?style=flat-square
[download-url]: https://npmjs.org/package/cnpmjs.org

![logo](https://raw.github.com/cnpm/cnpmjs.org/master/logo.png)

## Description

Private npm registry and web for Enterprise, base on [koa](http://koajs.com/),
MySQL and [Simple Store Service](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide).

Our goal is to provide a low cost maintenance, easy to use, and easy to scale solution for private npm.

## What can you do with `cnpmjs.org`?

* Build a private npm for your own enterprise. ([alibaba](http://www.alibaba.com/) is using `cnpmjs.org` now)
* Build a npm mirror. (we use it to build a mirror in China: [https://npmmirror.com/](https://npmmirror.com/))
* Use the private npm service provided by Alibaba Cloud DevOps which build with cnpm. [https://packages.aliyun.com/](https://packages.aliyun.com/?channel=pd_cnpm_github)

## Features

* **Support "scoped" packages**: [npm/npm#5239](https://github.com/npm/npm/issues/5239)
* **Support [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing)**
* **Simple to deploy**: only need `mysql` and a [simple store system](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide).
* **Low cost and easy maintenance**: `package.json` info can store in MySQL, MariaDB, SQLite or PostgreSQL.
tarball(tgz file) can store in Amazon S3 or other object storage service.
* **Automatic synchronization**: automatically sync from any registry specified. support two sync modes:
  - Sync all modules from upstream
  - Only sync the modules after first access.
* **Manual synchronization**: automatic synchronization may has little delay. you can sync manually on web page.
* **Customized client**: we provide a client [cnpm](https://github.com/cnpm/cnpm)
to extend `npm` with more features(`sync` command, [gzip](https://github.com/npm/npm-registry-client/pull/40) support).
And it is easy to wrap for your own registry which build with `cnpmjs.org`.
* **Compatible with npm client**: you can use the official npm client with `cnpmjs.org`.
you only need to change the registry in client config.
* **Support http_proxy**: if you're behind a firewall, you can provide a http proxy for cnpmjs.org.

## Docs

* [How to deploy](https://github.com/cnpm/cnpmjs.org/wiki/Deploy)
* cnpm client: [cnpm](https://github.com/cnpm/cnpm), `npm install -g cnpm`
* [Sync packages through `http_proxy`](https://github.com/cnpm/cnpmjs.org/wiki/Sync-packages-through-http_proxy)
* [Migrating from 1.x to 2.x](https://github.com/cnpm/cnpmjs.org/wiki/Migrating-from-1.x-to-2.x)
* [New features in 2.x](https://github.com/cnpm/cnpmjs.org/wiki/New-features-in-2.x).
* [wiki](https://github.com/cnpm/cnpmjs.org/wiki)

## Develop on your local machine

### Dependencies

* [node](http://nodejs.org) >= 8.0.0
* Databases: only required one type
  * [sqlite3](https://npmmirror.com/package/sqlite3) >= 3.0.2, we use `sqlite3` by default
  * [MySQL](http://dev.mysql.com/downloads/) >= 5.6.16, include `mysqld` and `mysql cli`. I test on `mysql@5.6.16`.
  * MariaDB
  * PostgreSQL

### Clone code and run test

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

Cnpmjs.org shipped with a simple but pragmatic Docker Compose configuration.With the configuration, you can set up a MySQL backend cnpmjs.org instance by executing just one command on Docker installed environment.

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

- [![阿里云](https://static.aliyun.com/images/www-summerwind/logo.gif)](http://click.aliyun.com/m/4288/) [![阿里云云效](https://img.alicdn.com/tfs/TB116yt3fb2gK0jSZK9XXaEgFXa-106-20.png)](https://devops.aliyun.com/?channel=pd_cnpm_github) (2016.2 - now)

## License

[MIT](LICENSE.txt)

<!-- GITCONTRIBUTOR_START -->

## Contributors

|[<img src="https://avatars.githubusercontent.com/u/156269?v=4" width="100px;"/><br/><sub><b>fengmk2</b></sub>](https://github.com/fengmk2)<br/>|[<img src="https://avatars.githubusercontent.com/u/985607?v=4" width="100px;"/><br/><sub><b>dead-horse</b></sub>](https://github.com/dead-horse)<br/>|[<img src="https://avatars.githubusercontent.com/u/14790466?v=4" width="100px;"/><br/><sub><b>greenkeeperio-bot</b></sub>](https://github.com/greenkeeperio-bot)<br/>|[<img src="https://avatars.githubusercontent.com/u/543405?v=4" width="100px;"/><br/><sub><b>ibigbug</b></sub>](https://github.com/ibigbug)<br/>|[<img src="https://avatars.githubusercontent.com/u/6897780?v=4" width="100px;"/><br/><sub><b>killagu</b></sub>](https://github.com/killagu)<br/>|[<img src="https://avatars.githubusercontent.com/u/1147375?v=4" width="100px;"/><br/><sub><b>alsotang</b></sub>](https://github.com/alsotang)<br/>|
| :---: | :---: | :---: | :---: | :---: | :---: |
|[<img src="https://avatars.githubusercontent.com/u/2842176?v=4" width="100px;"/><br/><sub><b>XadillaX</b></sub>](https://github.com/XadillaX)<br/>|[<img src="https://avatars.githubusercontent.com/u/327019?v=4" width="100px;"/><br/><sub><b>JacksonTian</b></sub>](https://github.com/JacksonTian)<br/>|[<img src="https://avatars.githubusercontent.com/u/11251401?v=4" width="100px;"/><br/><sub><b>Solais</b></sub>](https://github.com/Solais)<br/>|[<img src="https://avatars.githubusercontent.com/u/1134761?v=4" width="100px;"/><br/><sub><b>4simple</b></sub>](https://github.com/4simple)<br/>|[<img src="https://avatars.githubusercontent.com/u/6622122?v=4" width="100px;"/><br/><sub><b>21paradox</b></sub>](https://github.com/21paradox)<br/>|[<img src="https://avatars.githubusercontent.com/u/1294440?v=4" width="100px;"/><br/><sub><b>albertZhang2013</b></sub>](https://github.com/albertZhang2013)<br/>|
|[<img src="https://avatars.githubusercontent.com/u/6111524?v=4" width="100px;"/><br/><sub><b>ankurk91</b></sub>](https://github.com/ankurk91)<br/>|[<img src="https://avatars.githubusercontent.com/u/1935436?v=4" width="100px;"/><br/><sub><b>huangbowen521</b></sub>](https://github.com/huangbowen521)<br/>|[<img src="https://avatars.githubusercontent.com/u/5365267?v=4" width="100px;"/><br/><sub><b>gwenaelp</b></sub>](https://github.com/gwenaelp)<br/>|[<img src="https://avatars.githubusercontent.com/u/324440?v=4" width="100px;"/><br/><sub><b>KidkArolis</b></sub>](https://github.com/KidkArolis)<br/>|[<img src="https://avatars.githubusercontent.com/u/922240?v=4" width="100px;"/><br/><sub><b>tq0fqeu</b></sub>](https://github.com/tq0fqeu)<br/>|[<img src="https://avatars.githubusercontent.com/u/1587797?v=4" width="100px;"/><br/><sub><b>limianwang</b></sub>](https://github.com/limianwang)<br/>|
|[<img src="https://avatars.githubusercontent.com/u/900947?v=4" width="100px;"/><br/><sub><b>LoicMahieu</b></sub>](https://github.com/LoicMahieu)<br/>|[<img src="https://avatars.githubusercontent.com/u/1614482?v=4" width="100px;"/><br/><sub><b>paulvi</b></sub>](https://github.com/paulvi)<br/>|[<img src="https://avatars.githubusercontent.com/u/36651530?v=4" width="100px;"/><br/><sub><b>XXBeii</b></sub>](https://github.com/XXBeii)<br/>|[<img src="https://avatars.githubusercontent.com/u/1422472?v=4" width="100px;"/><br/><sub><b>jpuncle</b></sub>](https://github.com/jpuncle)<br/>|[<img src="https://avatars.githubusercontent.com/u/20092391?v=4" width="100px;"/><br/><sub><b>vincentmrlau</b></sub>](https://github.com/vincentmrlau)<br/>|[<img src="https://avatars.githubusercontent.com/u/4470552?v=4" width="100px;"/><br/><sub><b>stoneChen</b></sub>](https://github.com/stoneChen)<br/>|
[<img src="https://avatars.githubusercontent.com/u/2196373?v=4" width="100px;"/><br/><sub><b>dickeylth</b></sub>](https://github.com/dickeylth)<br/>|[<img src="https://avatars.githubusercontent.com/u/29791463?v=4" width="100px;"/><br/><sub><b>fossabot</b></sub>](https://github.com/fossabot)<br/>|[<img src="https://avatars.githubusercontent.com/u/1941756?v=4" width="100px;"/><br/><sub><b>gniavaj</b></sub>](https://github.com/gniavaj)<br/>|[<img src="https://avatars.githubusercontent.com/u/10371891?v=4" width="100px;"/><br/><sub><b>hellojukay</b></sub>](https://github.com/hellojukay)<br/>|[<img src="https://avatars.githubusercontent.com/u/5040076?v=4" width="100px;"/><br/><sub><b>liyangready</b></sub>](https://github.com/liyangready)<br/>|[<img src="https://avatars.githubusercontent.com/u/970903?v=4" width="100px;"/><br/><sub><b>anhulife</b></sub>](https://github.com/anhulife)<br/>

This project follows the git-contributor [spec](https://github.com/xudafeng/git-contributor), auto updated at `Mon Feb 14 2022 00:16:41 GMT+0800`.

<!-- GITCONTRIBUTOR_END -->

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fcnpm%2Fcnpmjs.org.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fcnpm%2Fcnpmjs.org?ref=badge_large)
