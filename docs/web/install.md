# Install & Get Started

## Deps

* MySQL Server: http://db4free.net/
* qiniu CDN: http://www.qiniu.com/
* redis session: https://garantiadata.com Support 24MB free spaces.
* node: >=0.10.21

## Clone

```bash
$ git clone git://github.com/fengmk2/cnpmjs.org.git $HOME/cnpmjs.org
$ cd $HOME/cnpmjs.org
```

## Create your `config.js`

```bash
$ vim config/config.js
```

`config.js` content sample:

```js
module.exports = {
  debug: false,
  enableCluster: true, // enable cluster mode
  logdir: 'your application log dir',
  mysqlServers: [
    {
      host: 'your mysql host',
      port: 3306,
      user: 'yourname',
      password: 'your password'
    }
  ],
  mysqlDatabase: 'cnpmjs',
  redis: {
    host: 'your redist host',
    port: 6379,
  },
  qn: {
    accessKey: "your qiniu appkey",
    secretKey: "your secret key",
    bucket: "foobucket",
    domain: "http://foobucket.u.qiniudn.com"
  },
  nfs: null, // you can set a nfs to replace qiniu cdn
  enablePrivate: true, // enable private mode, only admin can publish, other use just can sync package from source npm
  admins: {
    admin: 'admin@cnpmjs.org',
  },
  syncModel: 'exist', //`all` sync all packages, `exist` only update  exist packages, `none` do nothing
};
```

## Create MySQL Database and Tables

```bash
$ mysql -u yourname -p

mysql> use cnpmjs;
mysql> source docs/db.sql
```

## Use your own CDN
If you wan to use your own CDN instead of qiniu. Just look at `common/qnfs.js` and implement the interface like it, then pass it by set `config.nfs`.

## npm install

```bash
$ npm install
```

## start

```bash
$ ./bin/nodejsctl start

Starting cnpmjs.org ...
Start nodejs success. PID=27175
```

## open registry and web

```bash
# registry
$ open http://localhost:7001
# web
$ open http://localhost:7002
```

## use cnpm cli with your own registry
You do not need to write another command line tool with your own registry,
just alias [cnpm](http://github.com/fengmk2/cnpm), then you can get a npm client for you own registry.

```
# install cnpm first
npm install -g cnpm

# then alias lnpm to cnpm, but change config to your own registry
alias lnpm='cnpm --registry=http://localhost:7001\
 --registryweb=http://localhost:7002\
 --cache=$HOME/.npm/.cache/lnpm\
 --disturl=http://cnpmjs.org/dist\
 --userconfig=$HOME/.lnpmrc'

 #or put this in .zshrc or .bashrc
 echo "#lnpm alias\nalias lnpm='cnpm --registry=http://localhost:7001\
 --registryweb=http://localhost:7002\
 --cache=$HOME/.npm/.cache/lnpm\
 --disturl=http://cnpmjs.org/dist\
 --userconfig=$HOME/.lnpmrc'" >> $HOME/.zshrc && source $HOME/.zshrc
```
