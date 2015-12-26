'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'User',
      'role',
      {
        type: Sequelize.TINY_INT,
        allowNull: false,
        defaultValue: 0
      }
    )
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('User', 'role')
  }
};
