export default (sequelize, DataTypes) => {
  const UserRole = sequelize.define(
    "UserRole",
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "user_roles",
      timestamps: false,
      underscored: true,
    }
  );

  UserRole.associate = (models) => {
    UserRole.belongsTo(models.User, { foreignKey: "user_id" });
    UserRole.belongsTo(models.Role, { foreignKey: "role_id" });
  };

  return UserRole;
};