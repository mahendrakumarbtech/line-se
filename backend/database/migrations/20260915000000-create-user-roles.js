"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_roles", {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "roles", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
    });

  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_roles");
  },
};