
module.exports = (sequelize, DataTypes) => {
    const AdminPermission = sequelize.define(
      "admin_permission",
      {
        admin_permission_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        admin_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "admins",
            key: "admin_id",
          },
        },
        permission_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "permissions",
            key: "permission_id",
          },
        },
      },
      {
        tableName: "admin_permission",
        timestamps: false,
      }
    );
  
    return AdminPermission;
  };
  