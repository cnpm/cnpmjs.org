'use strict';

module.exports = () => {
  const { env } = process;

  return {
    orm: {
      delegate: 'orm',
      client: env.CNPMJS_DATABASE_CLIENT || 'mysql',
      database: env.CNPMJS_DATABASE_NAME || 'cnpmjs_dev',
      host: env.CNPMJS_DATABASE_HOST || 'localhost',
      port: env.CNPMJS_DATABASE_PORT || 3306,
      user: env.CNPMJS_DATABASE_USER || 'root',
      password: env.CNPMJS_DATABASE_PASSWORD || '',
    },
  };
};
