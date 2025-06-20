// models/productVehicle.js
module.exports = (sequelize, DataTypes) => {
    const ProductVehicle = sequelize.define(
      'ProductVehicle',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        productId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'Products', // Ensure this matches the actual table name
            key: 'product_id',
          },
        },
        vehicleId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'VehicleData', // Ensure this matches the actual table name
            key: 'vehicle_id',
          },
        },
      },
      {
        tableName: 'ProductVehicles', // Name of the join table
        timestamps: false, // Disable timestamps if not needed
      }
    );
  
    return ProductVehicle;
  };
  