'use strict';

module.exports = (app, Model) => {
  const { STRING, TEXT, BIGINT, BOOLEAN } = Model.DataTypes;

  class User extends Model {}

  User.init({
    id: { type: BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: STRING(100), allowNull: false },
    salt: { type: STRING(100), allowNull: false },
    passwordSha: { type: STRING(100), allowNull: false },
    ip: { type: STRING(64), allowNull: false },
    roles: { type: STRING(200), allowNull: false, defaultValue: '[]' },
    rev: { type: STRING(40), allowNull: false },
    email: { type: STRING(400), allowNull: false },
    json: { type: TEXT, allowNull: true },
    isNpmUser: { type: BOOLEAN, allowNull: false, defaultValue: false, column: 'npm_user' },
  }, {
    table: 'user',
  });

  return User;
};
