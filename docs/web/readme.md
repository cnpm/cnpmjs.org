# cnpmjs: Private npm registry and web for Enterprise

[![Build Status](https://secure.travis-ci.org/fengmk2/cnpmjs.org.png)](http://travis-ci.org/fengmk2/cnpmjs.org) [![Coverage Status](https://coveralls.io/repos/fengmk2/cnpmjs.org/badge.png)](https://coveralls.io/r/fengmk2/cnpmjs.org)

[![NPM](https://nodei.co/npm/cnpmjs.org.png?downloads=true&stars=true)](https://nodei.co/npm/cnpmjs.org/)

## What is this?

Private npm registry and web for Enterprise, base on MySQL and Simple File Store.

@[JacksonTian](https://github.com/JacksonTian/) had a talk about [private npm](https://speakerdeck.com/jacksontian/qi-ye-ji-node-dot-jskai-fa).

## Install your private npm registry

@see [Install and Get Started](/install).

## Registry

* Our public registry: http://registry.cnpmjs.org

Total Packages: <span id="total-packages"></span>

<style type="text/css">
  table.downloads {
    width: 30%;
  }
  table.downloads td.count {
    width: 30%;
    text-align: right;
  }
</style>
<table class="downloads">
  <tbody>
    <tr><td class="count"></td><td> downloads today</td></tr>
    <tr><td class="count"></td><td> downloads in this week</td></tr>
    <tr><td class="count"></td><td> downloads in this month</td></tr>
    <tr><td class="count"></td><td> downloads in the last day</td></tr>
    <tr><td class="count"></td><td> downloads in the last week</td></tr>
    <tr><td class="count"></td><td> downloads in the last month</td></tr>
  </tbody>
</table>

<script>
$(function () {
  $.getJSON('http://registry.cnpmjs.org/?callback=?', function (data) {
    $('#total-packages').html(data.doc_count);
    var downloads = $('table.downloads');
    downloads.find('tr:eq(0) td.count').html(data.download.today);
    downloads.find('tr:eq(1) td.count').html(data.download.thisweek);
    downloads.find('tr:eq(2) td.count').html(data.download.thismonth);
    downloads.find('tr:eq(3) td.count').html(data.download.lastday);
    downloads.find('tr:eq(4) td.count').html(data.download.lastweek);
    downloads.find('tr:eq(5) td.count').html(data.download.lastmonth);
  });
});
</script>

## cnpm cli

alias it:

```bash
alias cnpm="npm --registry=http://registry.cnpmjs.org --cache=$HOME/.npm/.cache/cnpm"

#Or alias it in .bashrc or .zshrc
$ echo '\n#alias for cnpm\nalias cnpm="npm --registry=http://registry.cnpmjs.org \
  --cache=$HOME/.npm/.cache/cnpm"' >> ~/.zshrc && source ~/.zshrc
```

Or you can just use our `cnpm` cli:

```bash
$ npm install cnpm -g
```

### adduser

```bash
$ cnpm adduser
```

### sync

Only `cnpm` cli has this command:

```bash
$ cnpm sync mocha
```

(TODO) sync package web page

```bash
$ open http://cnpmjs.org/sync
```

### publish

Meaning sync package from source npm.

Only `admin` user can publish package to private registry.

```bash
$ cnpm publish [name]
```

## TODO list

@see Github [Issues](https://github.com/fengmk2/cnpmjs.org/issues)

## Authors

```bash
$ git summary

 project  : cnpmjs.org
 repo age : 7 days
 active   : 36 days
 commits  : 88
 files    : 63
 authors  :
    53  fengmk2                 60.2%
    35  dead_horse              39.8%
```

## npm and cnpm relation

![npm&cnpm](https://docs.google.com/drawings/d/12QeQfGalqjsB77mRnf5Iq5oSXHCIUTvZTwECMonqCmw/pub?w=960&h=720)

## 捐赠 Donate
如果您觉得 [cnpmjs.org] 对您有帮助，欢迎请作者一杯咖啡.

[![Donate](https://img.alipay.com/sys/personalprod/style/mc/btn-index.png)](https://me.alipay.com/imk2)

 [cnpmjs.org]: http://cnpmjs.org/
 [registry.cnpmjs.org]: http://registry.cnpmjs.org/
