export default (sequelize, DataTypes) => {
  const UserOrganization = sequelize.define(
    "UserOrganization",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      tableName: "user_organizations",
      timestamps: true,
      underscored: true,
    }
  );

  UserOrganization.associate = (models) => {
    UserOrganization.belongsTo(models.User, { foreignKey: "user_id" });
    UserOrganization.belongsTo(models.Organization, { foreignKey: "organization_id" });
    UserOrganization.belongsTo(models.Role, { foreignKey: "role_id" });
  };

  return UserOrganization;
};