module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define(
    "Vehicle",
    {
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      vm_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "vechilemanagement",
          key: "vm_id",
        },
      },
      vehicle_brand: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vehicle_model: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vehicle_varient: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "vehicleDatas",
      timestamps: true,
    }
  );

  return Vehicle;
};
