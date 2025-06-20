module.exports = (sequelize, DataTypes) => {
    const Vehicle = sequelize.define(
      "vechilemanagement",
      {
        vm_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        vehicle_type: {
          type: DataTypes.STRING,
          allowNull: true,
        }
      },
      {
        tableName: "vechileManagement",
        timestamps: true,
      }
    );
  
    return Vehicle;
  };
  