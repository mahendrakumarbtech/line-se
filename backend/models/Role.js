export default (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role_type: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      tableName: "roles",
      timestamps: true,
      underscored: true,
    }
  );

  Role.associate = (models) => {
    Role.hasMany(models.UserRole, { foreignKey: "role_id" });

    Role.belongsTo(models.Organization, { foreignKey: "organization_id" });
    Role.hasMany(models.UserOrganization, { foreignKey: "role_id" });
    Role.belongsToMany(models.Permission, {
      through: models.RolePermission,
      foreignKey: "role_id",
      otherKey: "permission_id",
    });
  };

  return Role;
};