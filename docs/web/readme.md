# cnpmjs: Private npm registry and web for Enterprise

[![Build Status](https://secure.travis-ci.org/fengmk2/cnpmjs.org.png)](http://travis-ci.org/fengmk2/cnpmjs.org) [![Coverage Status](https://coveralls.io/repos/fengmk2/cnpmjs.org/badge.png)](https://coveralls.io/r/fengmk2/cnpmjs.org)

[![NPM](https://nodei.co/npm/cnpmjs.org.png?downloads=true&stars=true)](https://nodei.co/npm/cnpmjs.org/)

![logo](https://raw.github.com/fengmk2/cnpmjs.org/master/logo.png)

## What is this?

Private npm registry and web for Enterprise, base on MySQL and Simple File Store.

@[JacksonTian](https://github.com/JacksonTian/) had a talk about [private npm](https://speakerdeck.com/jacksontian/qi-ye-ji-node-dot-jskai-fa).

## Registry

* Our public registry: http://registry.cnpmjs.org

alias it:

```bash
$ alias cnpm='npm --registry=http://registry.cnpmjs.org'
```

### adduser

```bash
$ cnpm adduser
```

### publish (Sync package)

Meaning sync package from source npm. Only admin user can publish package to private registry.

```bash
$ cnpm publish [name]
```

### (TODO) admin publish package

```bash
$ open http://cnpmjs.org/publish
```

## TODO list

@see Github [Issues](https://github.com/fengmk2/cnpmjs.org/issues)

## Authors

```bash
$ git summary

 project  : cnpmjs.org
 repo age : 3 days
 active   : 15 days
 commits  : 32
 files    : 44
 authors  :
    19  fengmk2                 59.4%
    13  dead_horse              40.6%
```

## npm & cnpm

![npm&cnpm](https://docs.google.com/drawings/d/12QeQfGalqjsB77mRnf5Iq5oSXHCIUTvZTwECMonqCmw/pub?w=960&h=720)

## 捐赠 Donate
如果您觉得 [cnpmjs.org] 对您有帮助，欢迎请作者一杯咖啡.

[![Donate](https://img.alipay.com/sys/personalprod/style/mc/btn-index.png)](https://me.alipay.com/imk2)

 [cnpmjs.org]: http://cnpmjs.org/
 [registry.cnpmjs.org]: http://registry.cnpmjs.org/
