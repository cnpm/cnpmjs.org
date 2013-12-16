# cnpmjs.org: Private npm registry and web for Enterprise

[![Build Status](https://secure.travis-ci.org/fengmk2/cnpmjs.org.png)](http://travis-ci.org/fengmk2/cnpmjs.org) [![Coverage Status](https://coveralls.io/repos/fengmk2/cnpmjs.org/badge.png)](https://coveralls.io/r/fengmk2/cnpmjs.org)

[![NPM](https://nodei.co/npm/cnpmjs.org.png?downloads=true&stars=true)](https://nodei.co/npm/cnpmjs.org/)

## What is this?

> Private npm registry and web for Enterprise, base on MySQL and Simple File Store.

@[JacksonTian](https://github.com/JacksonTian/) had a talk about [private npm](https://speakerdeck.com/jacksontian/qi-ye-ji-node-dot-jskai-fa).

## Install your private npm registry

@see [Install and Get Started](/install).

## Registry

* Our public registry: [registry.cnpmjs.org](http://registry.cnpmjs.org)
* Current [cnpmjs.org](/) version: <span id="app-version"></span>

<table class="downloads">
  <tbody>
    <tr>
      <td class="count" id="total-packages"></td><td>total packages</td>
      <td class="count" id="total-versions"></td><td>total package versions</td>
      <td class="count" id="total-deletes"></td><td>total delete packages</td>
    </tr>
    <tr>
      <td class="count"></td><td> downloads today</td>
      <td class="count"></td><td> downloads in this week</td>
      <td class="count"></td><td> downloads in this month</td>
    </tr>
    <tr>
      <td class="count"></td><td> downloads in the last day</td>
      <td class="count"></td><td> downloads in the last week</td>
      <td class="count"></td><td> downloads in the last month</td>
    </tr>
  </tbody>
</table>

<div class="sync" style="display:none;">
  <h3>Sync Status</h3>
  <p id="sync-model"></p>
  <p>Last sync time is <span id="last-sync-time"></span>. </p>
  <p style="display:none;" class="syncing alert alert-info">The sync worker is working in the backend now. </p>
  <table class="sync-status">
    <tbody>
      <tr>
        <td><span id="need-sync"></span> packages need to be sync</td>
        <td><span id="success-sync"></span> packages and dependencies sync successed</td>
      </tr>
      <tr>
        <td><span id="fail-sync"></span> packages and dependencies sync failed</td>
        <td style="display: none;" class="syncing"><span id="left-sync"></span> packages and dependencies waiting for sync</td>
      </tr>
    </tbody>
  </table>
</div>

Running on [Node.js](http://nodejs.org), version <span id="node-version"></span>.

<script>
$(function () {
  function humanize(n, options) {
    options = options || {};
    var d = options.delimiter || ',';
    var s = options.separator || '.';
    n = n.toString().split('.');
    n[0] = n[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + d);
    return n.join(s);
  }

  $.getJSON('/total', function (data) {
    $('#total-packages').html(humanize(data.doc_count));
    $('#total-versions').html(humanize(data.doc_version_count));
    $('#total-deletes').html(humanize(data.doc_del_count));

    var downloads = $('table.downloads');
    downloads.find('td.count:eq(3)').html(humanize(data.download.today));
    downloads.find('td.count:eq(4)').html(humanize(data.download.thisweek));
    downloads.find('td.count:eq(5)').html(humanize(data.download.thismonth));
    downloads.find('td.count:eq(6)').html(humanize(data.download.lastday));
    downloads.find('td.count:eq(7)').html(humanize(data.download.lastweek));
    downloads.find('td.count:eq(8)').html(humanize(data.download.lastmonth));

    $('#node-version').html(data.node_version || 'v0.10.22');
    $('#app-version').html(data.app_version || '0.0.0');

    if (data.sync_model === 'all') {
      $('#sync-model').html('This registry will sync all packages from official registry.');
      $('#last-sync-time').html(new Date(data.last_sync_time));
      $('.sync').show();
    } else if (data.sync_model === 'exist') {
      $('#sync-model').html('This registry will only update exist packages from official registry.');
      $('#last-sync-time').html(new Date(data.last_exist_sync_time));
      $('.sync').show();
    }
    data.sync_status && $('.syncing').show();

    $('#need-sync').html(data.need_sync_num);
    $('#success-sync').html(data.success_sync_num);
    $('#fail-sync').html(data.fail_sync_num);
    $('#left-sync').html(data.left_sync_num);
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

### sync

Only `cnpm` cli has this command:

```bash
$ cnpm sync connect
```

sync package on web: [cnpmjs.org/sync/connect](http://cnpmjs.org/sync/connect)

```bash
$ open http://cnpmjs.org/sync/connect
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
 repo age : 9 days
 active   : 49 days
 commits  : 126
 files    : 70
 authors  :
    73  fengmk2                 57.9%
    53  dead_horse              42.1%
```

## npm and cnpm relation

![npm&cnpm](https://docs.google.com/drawings/d/12QeQfGalqjsB77mRnf5Iq5oSXHCIUTvZTwECMonqCmw/pub?w=960&h=720)

## 捐赠 Donate
如果您觉得 [cnpmjs.org] 对您有帮助，欢迎请作者一杯咖啡.

[![Donate](https://img.alipay.com/sys/personalprod/style/mc/btn-index.png)](https://me.alipay.com/imk2)

 [cnpmjs.org]: http://cnpmjs.org/
 [registry.cnpmjs.org]: http://registry.cnpmjs.org/
