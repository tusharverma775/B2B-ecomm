module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "tuser",
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      personName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isNumeric: true,
          len: [10, 10] 
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gstNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pancardNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
         
        },
      },
      adminApprovalStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
    
      },
      token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isNumberVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      gstVerficationStatus:{
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "Pending",
        validate:{
          isIn: [["Pending", "UnderProcess", "Rejected", "Accepted"]],
        },
        isblocked: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      
    },
    {
      tableName: "tuser",
      timestamps: true,
    }
  );

  return User;
};
