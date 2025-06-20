module.exports = (sequelize, DataTypes) => {
  const quotations = sequelize.define(
    "quotationTable",
    {
      quotation_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tuser",
          key: "user_id",
        },
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "producttsss",
          key: "product_id",
        },
      },
      ContactPersonName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ContactPersonEmail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ContactPersonPhone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending",
        validate: {
          isIn: [["Pending", "Viewed", "Rejected", "MailSent", "Approved"]],
        },
      },
    },
    {
      tableName: "quotationTable",
      timeStamps: true,
    }
  );
  return quotations
};
