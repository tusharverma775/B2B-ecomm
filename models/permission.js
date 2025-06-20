module.exports = (sequelize, DataTypes) => {
    const Permission = sequelize.define(
      "permission",
      {
        permission_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        permission_name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
      },
      {
        tableName: "permissions",
        timestamps: false,
      }
    );
  
    return Permission;
  };
  