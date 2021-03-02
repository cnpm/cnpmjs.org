'use strict';

module.exports = (app, Model) => {
  const { STRING, TEXT, BIGINT, BOOLEAN } = Model;

  return class User extends Model {
    static get table() { return 'user'; }
    static get schema() {
      return {
        id: { type: BIGINT.UNSIGNED, autoIncrement: true },
        name: { type: STRING(100), allowNull: false },
        salt: { type: STRING(100), allowNull: false },
        passwordSha: { type: STRING(100), allowNull: false },
        ip: { type: STRING(64), allowNull: false },
        roles: { type: STRING(200), allowNull: false, defaultValue: '[]' },
        rev: { type: STRING(40), allowNull: false },
        email: { type: STRING(400), allowNull: false },
        json: { type: TEXT, allowNull: true },
        isNpmUser: { type: BOOLEAN, allowNull: false, defaultValue: false, column: 'npm_user' },
      };
    }
  };
};
