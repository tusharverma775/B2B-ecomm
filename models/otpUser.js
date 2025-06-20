module.exports = (sequelize, DataTypes) => {
    const UserOTP = sequelize.define(
      "userotpp",
      {
        userOtp_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        otpEmail: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        otp: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        otpPhone: {
            type: DataTypes.STRING,
            allowNull: true,
          },
        user_id: {
          type: DataTypes.INTEGER,
          defaultValue: false,
          references: {
            model: "tuser",
            key: "user_id",
        }}
      },{
        tableName: "userotpp",
        timestamps: true,
      }
    );
  
    return UserOTP;
  };
  