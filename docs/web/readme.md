# cnpmjs.org: Private npm registry and web for Enterprise

[![Build Status](https://secure.travis-ci.org/cnpm/cnpmjs.org.png)](http://travis-ci.org/cnpm/cnpmjs.org) [![Coverage Status](https://coveralls.io/repos/cnpm/cnpmjs.org/badge.png)](https://coveralls.io/r/cnpm/cnpmjs.org) [![Dependency Status](https://gemnasium.com/cnpm/cnpmjs.org.png)](https://gemnasium.com/cnpm/cnpmjs.org)

[![NPM](https://nodei.co/npm/cnpmjs.org.png?downloads=true&stars=true)](https://nodei.co/npm/cnpmjs.org/)

## What is this?

> Private npm registry and web for Enterprise, base on [koa](http://koajs.com/), MySQL and [Simple Store Service](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide).

@[JacksonTian](https://github.com/JacksonTian/) had a talk about [private npm](https://speakerdeck.com/jacksontian/qi-ye-ji-node-dot-jskai-fa).

## Install your private npm registry

@see [Install and Get Started](/install).

## Registry

* Our public registry: [r.cnpmjs.org](http://r.cnpmjs.org), syncing from [registry.npmjs.org](http://registry.npmjs.org)
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
  <p class="syncing alert alert-info">The sync worker is working in the backend now. </p>
  <table class="sync-status">
    <tbody>
      <tr>
        <td><span id="need-sync"></span> packages need to be sync</td>
        <td class="syncing"><span id="left-sync"></span> packages and dependencies waiting for sync</td>
        <td><span id="percent-sync"></span>% progress</td>
      </tr>
      <tr>
        <td><span id="success-sync"></span> packages and dependencies sync successed</td>
        <td><span id="fail-sync"></span> packages and dependencies sync failed</td>
        <td>last success: <span id="last-success-name"></span></td>
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
    } else if (data.sync_model === 'exist') {
      $('#sync-model').html('This registry will only update exist packages from official registry.');
      $('#last-sync-time').html(new Date(data.last_exist_sync_time));
    }

    $('#need-sync').html(data.need_sync_num);
    $('#success-sync').html(data.success_sync_num);
    $('#fail-sync').html(data.fail_sync_num);
    $('#left-sync').html(data.left_sync_num);
    $('#percent-sync').html(Math.floor(data.success_sync_num / data.need_sync_num * 100));
    $('#last-success-name').html('<a target="_blank" href="/package/' + data.last_sync_module + '">' +
      data.last_sync_module + '</a>');

    if (!data.sync_status) {
      $('.syncing').html('');
    }

    $('.sync').show();
  });
});
</script>

## cnpm cli

alias it:

```bash
alias cnpm="npm --registry=http://r.cnpmjs.org \
--cache=$HOME/.npm/.cache/cnpm \
--disturl=http://dist.u.qiniudn.com \
--userconfig=$HOME/.cnpmrc"

#Or alias it in .bashrc or .zshrc
$ echo '\n#alias for cnpm\nalias cnpm="npm --registry=http://r.cnpmjs.org \
  --cache=$HOME/.npm/.cache/cnpm \
  --disturl=http://dist.u.qiniudn.com \
  --userconfig=$HOME/.cnpmrc"' >> ~/.zshrc && source ~/.zshrc
```

Or you can just use our `cnpm` cli:

```bash
$ npm install cnpm -g
```

### install

Install package from [r.cnpmjs.org](http://r.cnpmjs.org). When installing a package or version does not exist, it will try to install from the official registry([registry.npmjs.org](http://registry.npmjs.org)), and sync this package to cnpm in the backend.

```
$ cnpm install [name]
```

### sync

Only `cnpm` cli has this command. Meaning sync package from source npm.

```bash
$ cnpm sync connect
```

sync package on web: [cnpmjs.org/sync/connect](http://cnpmjs.org/sync/connect)

```bash
$ open http://cnpmjs.org/sync/connect
```

### publish / unpublish

Only `admin` user can publish / unpublish package to private registry.

```bash
$ cnpm publish [name]
$ cnpm unpublish [name]
```

### Other commands

Support all the other npm commands. e.g.:

```bash
$ cnpm info cnpm
```

## TODO list

@see Github [Issues](https://github.com/cnpm/cnpmjs.org/issues)

## Authors

Release [History](/history).

```bash
$ git summary

 project  : cnpmjs.org
 repo age : 7 weeks
 active   : 132 days
 commits  : 315
 files    : 88
 authors  :
   190  fengmk2                 60.3%
   122  dead_horse              38.7%
     2  4simple                 0.6%
     1  Alsotang                0.3%
```

## npm and cnpm relation

![npm&cnpm](https://docs.google.com/drawings/d/12QeQfGalqjsB77mRnf5Iq5oSXHCIUTvZTwECMonqCmw/pub?w=383&h=284)

## 捐赠 Donate
如果您觉得 [cnpmjs.org] 对您有帮助，欢迎请作者一杯咖啡.

[![Donate](https://img.alipay.com/sys/personalprod/style/mc/btn-index.png)](https://me.alipay.com/imk2)

 [cnpmjs.org]: http://cnpmjs.org/
 [registry.cnpmjs.org]: http://registry.cnpmjs.org/
