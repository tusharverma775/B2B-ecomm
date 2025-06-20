module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tyre_brand: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tyre_model: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tyre_size: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tyre_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tyre_position: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tyre_material: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rim_size: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      SKU: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      vehicle_ids:{
        type:DataTypes.JSON,
        allowNull: true,
      }
    },
    {
      tableName: "producttsss",
      timestamps: true,
    }
  );

  

  return Product;
};
