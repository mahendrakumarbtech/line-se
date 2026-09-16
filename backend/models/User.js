export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: { type: DataTypes.TEXT, allowNull: true },
      city: { type: DataTypes.STRING, allowNull: true },
      state: { type: DataTypes.STRING, allowNull: true },
      country: { type: DataTypes.STRING, allowNull: true },
      pincode: { type: DataTypes.STRING, allowNull: true },
      geo_location: { type: DataTypes.STRING, allowNull: true },
      latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
      status: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true,
    }
  );

  User.associate = (models) => {
    User.hasOne(models.UserRole, { foreignKey: "user_id" });

    User.hasMany(models.UserOrganization, { foreignKey: "user_id" });
    User.belongsToMany(models.Organization, {
      through: models.UserOrganization,
      foreignKey: "user_id",
      otherKey: "organization_id",
    });
  };

  return User;
};