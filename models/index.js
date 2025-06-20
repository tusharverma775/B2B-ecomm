const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
const sequelize = require("../config/database");

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// admin
db.admin = require("./admin")(sequelize, DataTypes);
db.adminotptable = require("./adminotp")(sequelize, DataTypes);
db.permission = require("./permission")(sequelize, DataTypes);
db.adminPermission = require("./admin_permission")(sequelize, DataTypes);
db.vehicleManagement = require("./vehicleManagement")(sequelize, DataTypes);
db.VehicleData = require("./vehicleModel")(sequelize, DataTypes);
db.product = require("./product")(sequelize, DataTypes);
db.ProductVehicle = require("./ProductVehicle")(sequelize, DataTypes);
db.contact = require("./contact")(sequelize, DataTypes);
db.support = require("./supportquery")(sequelize, DataTypes);

//user
db.user = require("./user")(sequelize, DataTypes);
db.userOtp = require("./otpUser")(sequelize, DataTypes);
db.cart = require("./cart")(sequelize, DataTypes);
db.quotations = require("./quotations")(sequelize, DataTypes);
db.order = require("./order")(sequelize, DataTypes);

db.admin.belongsToMany(db.permission, {
  through: db.adminPermission,
  foreignKey: "admin_id",
});
db.permission.belongsToMany(db.admin, {
  through: db.adminPermission,
  foreignKey: "permission_id",
});

db.adminPermission.belongsTo(db.permission, { foreignKey: "permission_id" });
db.adminPermission.belongsTo(db.admin, { foreignKey: "admin_id" });

db.permission.hasMany(db.adminPermission, { foreignKey: "permission_id" });

db.adminPermission.belongsTo(db.permission, { foreignKey: "permission_id" });
db.permission.hasMany(db.adminPermission, { foreignKey: "permission_id" });

db.vehicleManagement.belongsTo(db.VehicleData, { foreignKey: "vm_id" });
db.VehicleData.hasMany(db.vehicleManagement, { foreignKey: "vm_id" });

db.product.belongsToMany(db.VehicleData, {
  through: db.ProductVehicle,
  foreignKey: "productId",
  otherKey: "vehicleId",
});

db.VehicleData.belongsToMany(db.product, {
  through: db.ProductVehicle,
  foreignKey: "vehicleId",
  otherKey: "productId",
});

//user realtion

db.userOtp.belongsTo(db.user, { foreignKey: "user_id" });
db.user.hasMany(db.userOtp, { foreignKey: "user_id" });

db.cart.belongsTo(db.product, { foreignKey: "product_id" });
db.product.hasMany(db.cart, { foreignKey: "product_id" });

db.quotations.belongsTo(db.user, { foreignKey: "user_id" });
db.user.hasMany(db.quotations, { foreignKey: "user_id" });

db.quotations.belongsTo(db.product, { foreignKey: "product_id" });
db.product.hasMany(db.quotations, { foreignKey: "product_id" });



sequelize.sync({ force: false });
module.exports = db;
