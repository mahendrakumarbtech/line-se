"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("organizations", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      type: { type: Sequelize.INTEGER, allowNull: false },
      logo: { type: Sequelize.STRING, allowNull: true },
      gst_number: { type: Sequelize.STRING, allowNull: true },
      pan_number: { type: Sequelize.STRING, allowNull: true },
      cin_number: { type: Sequelize.STRING, allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      city: { type: Sequelize.STRING, allowNull: true },
      state: { type: Sequelize.STRING, allowNull: true },
      country: { type: Sequelize.STRING, allowNull: true },
      pincode: { type: Sequelize.STRING, allowNull: true },
      geo_location: { type: Sequelize.STRING, allowNull: true },
      latitude: { type: Sequelize.DECIMAL(10, 8), allowNull: true },
      longitude: { type: Sequelize.DECIMAL(11, 8), allowNull: true },
      status: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("organizations");
  },
};