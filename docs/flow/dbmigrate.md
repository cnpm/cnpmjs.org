Adding column `role` on user table
------

1. Create config file like this:

```js
var path = require('path')
var root = path.dirname(__dirname);
var dataDir = path.join(process.env.HOME || root, '.cnpmjs.org');

module.exports = {
  "development": {
    db: 'cnpmjs_test',
    dialect: 'sqlite',
    storage: path.join(dataDir, 'data.sqlite'),
  },
  "production": {
    "username": "root",
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

2. run migrate command:

`$ ./node_modules/.bin/sequelize --config CONFIG_PATH db:migrate`

or 
`$ NODE_ENV=production $./node_modules/.bin/sequelize --config CONFIG_PATH db:migrate`

3. output

```

Sequelize [Node: 4.0.0, CLI: 2.2.1, ORM: 2.0.6]

Loaded configuration file "config/config.js".
Using environment "development".
Using gulpfile ...
Starting 'db:migrate'...
== 20151019155937-addAdminField: migrating =======
== 20151019155937-addAdminField: migrated (0.017s)

```
