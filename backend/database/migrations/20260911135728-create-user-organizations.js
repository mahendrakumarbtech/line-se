"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_organizations", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "organizations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "roles", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      status: { type: Sequelize.INTEGER, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addConstraint("user_organizations", {
      fields: ["user_id", "organization_id"],
      type: "unique",
      name: "uniq_user_organization",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_organizations");
  },
};