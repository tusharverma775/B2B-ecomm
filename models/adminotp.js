module.exports = (sequelize, DataTypes) => {
    const AdminOTP = sequelize.define(
      "adminotp",
      {
        adminOtp_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        otp: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        admin_id: {
          type: DataTypes.INTEGER,
          defaultValue: false,
        },
      },
      {
        tableName: "adminotp",
        timestamps: true,
      }
    );
  
    return AdminOTP;
  };
  