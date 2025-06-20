module.exports = (sequelize, DataTypes) => {
    const support = sequelize.define("support", {
      support_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true, 
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true, 
        validate: {
          isEmail: true,
        },
      },
      phoneNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT, 
        allowNull: true,
      },
    });
  
    return support;
  };
  