# cnpmjs.org: Private npm registry and web for Company

So `cnpm` is meaning: **Company npm**.

## Registry

- Our public registry: [r.cnpmjs.org](//r.cnpmjs.org), syncing from [registry.npmjs.org](//registry.npmjs.org)
- [cnpmjs.org](/) version: <span id="app-version"></span>
- [Node.js](https://nodejs.org) version: <span id="node-version"></span>
- For developers behind the GFW, please visit [the Chinese mirror](https://npm.taobao.org). 中国用户请访问[国内镜像站点](https://npm.taobao.org/)。

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

Running on [Node.js](https://nodejs.org), version <span id="node-version"></span>.

<script src="/js/readme.js"></script>

## Version Badge

Default style is `flat-square`.

Badge URL: `https://cnpmjs.org/badge/v/cnpmjs.org.svg` ![cnpmjs.org-badge](//cnpmjs.org/badge/v/cnpmjs.org.svg)

* `<0.1.0 & >=0.0.0`: ![red-badge](https://img.shields.io/badge/cnpm-0.0.1-red.svg?style=flat-square)
* `<1.0.0 & >=0.1.0`: ![red-badge](https://img.shields.io/badge/cnpm-0.1.0-green.svg?style=flat-square)
* `>=1.0.0`: ![red-badge](https://img.shields.io/badge/cnpm-1.0.0-blue.svg?style=flat-square)

## Usage

use our npm client [cnpm](https://github.com/cnpm/cnpm)(More suitable with cnpmjs.org and gzip support), you can get our client through npm:

```bash
$ npm install -g cnpm --registry=https://r.cnpmjs.org
```

Or you can alias NPM to use it:

```bash
alias cnpm="npm --registry=https://r.cnpmjs.org \
--cache=$HOME/.npm/.cache/cnpm \
--disturl=https://cnpmjs.org/mirrors/node \
--userconfig=$HOME/.cnpmrc"

#Or alias it in .bashrc or .zshrc
$ echo '\n#alias for cnpm\nalias cnpm="npm --registry=https://r.cnpmjs.org \
  --cache=$HOME/.npm/.cache/cnpm \
  --disturl=https://cnpmjs.org/mirrors/node \
  --userconfig=$HOME/.cnpmrc"' >> ~/.zshrc && source ~/.zshrc
```

### install

Install package from [r.cnpmjs.org](//r.cnpmjs.org). When installing a package or version does not exist, it will try to install from the official registry([registry.npmjs.org](//registry.npmjs.org)), and sync this package to cnpm in the backend.

```bash
$ cnpm install [name]
```

### sync

Only `cnpm` cli has this command. Meaning sync package from source npm.

```bash
$ cnpm sync connect
```

sync package on web: [sync/connect](/sync/connect)

```bash
$ open https://cnpmjs.org/sync/connect
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

## Histories

Release [History](/history).

## npm and cnpm relation

![npm&cnpm](https://dn-cnpm.qbox.me/cnpm-npm-relation.png)
