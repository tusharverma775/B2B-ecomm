module.exports = (sequelize, DataTypes) => {
    const Admin = sequelize.define(
      "admin",
      {
        admin_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        username: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true, 
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        token: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        is_superadmin: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      },
      {
        tableName: "admin",
        timestamps: true,
      }
    );
  
    return Admin;
  };
  