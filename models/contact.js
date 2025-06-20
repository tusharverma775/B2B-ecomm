module.exports = (sequelize, DataTypes) => {
    const Contact = sequelize.define("Contact", {
      contact_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true, 
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
  
    return Contact;
  };
  