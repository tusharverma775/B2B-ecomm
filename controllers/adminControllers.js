var db = require("../models/index");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var randomstring = require("randomstring");
var { sendMail, sendMail2 } = require("../helper/sendMail");
var path = require("path");
var { Op } = require("sequelize");
var Admin = db.admin;
var AdminOtp = db.adminotptable;
var Permission = db.permission;
var AdminPermission = db.adminPermission;
var Users = db.user;
var VM = db.vehicleManagement;
var VD = db.VehicleData;
var Product = db.product;
var Quotations = db.quotations;
var Support = db.support;
var Order = db.order;
var contact = db.contact;
const generateToken = (admin_id) => {
  try {
    const token = jwt.sign({ admin_id }, process.env.JWT_SECRET, {
      expiresIn: "72h",
    });
    return token;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate token");
  }
};

const superadminsignup = async (req, res) => {
  const { username, password } = req.body;

  try {
    ("");
    const existingSuperadmin = await Admin.findOne({
      where: { is_superadmin: true },
    });
    if (existingSuperadmin) {
      return res.status(403).json({
        message: "Superadmin already exists. Only one superadmin is allowed.",
      });
    }

    // Check if the username already exists
    const existingUser = await Admin.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: "Username already taken" });
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create the new superadmin
    const newSuperadmin = await Admin.create({
      username,
      password: hashedPassword,
      is_superadmin: true, // Set this user as the superadmin
    });

    res
      .status(201)
      .json({ message: "Superadmin created successfully", newSuperadmin });
  } catch (error) {
    console.error("Error creating superadmin:", error);
    res.status(500).json({ message: "Error creating superadmin", error });
  }
};

const subadminSignup = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await Admin.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exist" });
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create the new admin user
    const newUser = await Admin.create({
      username,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Admin created successfully", newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user", error });
  }
};

const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      return res.status(401).json({ message: "Invalid username " });
    }

    const passwordMatch = bcrypt.compareSync(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = generateToken(admin.admin_id);

    admin.token = token;
    admin.save();

    return res.status(200).json({
      message: "Login successful",
      token: token,
      admin: {
        id: admin.admin_id,
        username: admin.username,
        is_superadmin: admin.is_superadmin,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const adminLogout = async (req, res) => {
  try {
    const adminID = req.admin.admin_id;
    const admin = await Admin.findByPk(adminID);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found." });
    }

    admin.token = null;
    await admin.save();

    res.status(200).json({ message: "Admin logged out successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const adminForgetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const existingEmail = await Admin.findOne({ where: { username: email } });
    if (!existingEmail) {
      return res.status(203).json({ message: "Admin Email doesnot found" });
    }

    const adminID = existingEmail.admin_id;

    const otp = randomstring.generate({ length: 6, charset: "numeric" });
    const mailSubject = "OTP for Password Reset";
    const content = `<p>Your OTP for resetting your password is: ${otp}</p>`;
    await sendMail(email, mailSubject, content);
    await AdminOtp.create({
      otp: otp,
      admin_id: existingEmail.admin_id,
    });

    res
      .status(200)
      .json({ message: "OTP sent to your email.", email: email, adminID });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error while doing forget password for admin" });
  }
};

const adminVerifyOtpAndResetPassword = async (req, res) => {
  const otp = req.body.otp;
  const newPassword = req.body.newPassword;
  const admin_id = req.params.admin_id;

  try {
    const adminotpdata = await AdminOtp.findOne({
      where: { otp: otp, admin_id: admin_id },
    });
    if (!adminotpdata) {
      return res
        .status(404)
        .json({ message: "Admin not found or otp is incorrect" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const admin = await Admin.findByPk(admin_id);

    await admin.update({ password: hashedPassword });

    const token = generateToken(admin.admin_id);

    admin.token = token;
    adminotpdata.destroy();
    res.status(200).json({ message: "Password reset successful", token });
  } catch (error) {
    console.error("Error verifying OTP or resetting password:", error);
    res.status(500).json({ message: "Error resetting password." });
  }
};

const addPermission = async (req, res) => {
  try {
    const { permission_name } = req.body;

    if (!permission_name) {
      return res.status(400).json({ message: "Permission name is required" });
    }
    const existingPermission = await Permission.findOne({
      where: { permission_name },
    });

    if (existingPermission) {
      return res.status(400).json({ message: "Permission already exists" });
    }
    const newPermission = await Permission.create({ permission_name });

    res.status(201).json({
      message: "Permission added successfully",
      permission: newPermission,
    });
  } catch (error) {
    console.error("Error adding permission:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();

    if (!permissions || permissions.length === 0) {
      return res.status(404).json({ message: "No permissions found" });
    }

    res.status(200).json({
      message: "Permissions retrieved successfully",
      permissions,
    });
  } catch (error) {
    console.error("Error retrieving permissions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deletePermissionById = async (req, res) => {
  try {
    const { permission_id } = req.params;
    const permission = await Permission.findByPk(permission_id);

    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }
    await permission.destroy();

    res.status(200).json({
      message: "Permission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting permission:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const addAdminPermissions = async (req, res) => {
  try {
    const { admin_id, permission_ids } = req.body;
    if (
      !admin_id ||
      !Array.isArray(permission_ids) ||
      permission_ids.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Admin ID and permission IDs are required" });
    }

    const admin = await Admin.findByPk(admin_id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const permissions = await Permission.findAll({
      where: {
        permission_id: permission_ids,
      },
    });

    if (permissions.length !== permission_ids.length) {
      return res.status(400).json({
        message: "Some permissions do not exist",
      });
    }

    const Existingadmin = await AdminPermission.findOne({
      where: { admin_id: admin_id },
    });
    if (Existingadmin) {
      return res.status(400).json({
        message:
          "This sub-admin Permissions already created. Please go to update section.",
      });
    }

    const adminPermissions = permission_ids.map((permission_id) => ({
      admin_id,
      permission_id,
    }));
    console.log(adminPermissions);

    await AdminPermission.bulkCreate(adminPermissions, {
      logging: console.log,
      ignoreDuplicates: true,
    });
    res.status(201).json({
      message: "Permissions assigned to admin successfully",
    });
  } catch (error) {
    console.error("Error assigning permissions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateAdminPermissions = async (req, res) => {
  try {
    const { admin_id, permission_ids } = req.body;
    if (
      !admin_id ||
      !Array.isArray(permission_ids) ||
      permission_ids.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Admin ID and permission IDs are required" });
    }
    const admin = await Admin.findByPk(admin_id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const permissions = await Permission.findAll({
      where: {
        permission_id: permission_ids,
      },
    });

    if (permissions.length !== permission_ids.length) {
      return res.status(400).json({
        message: "Some permissions do not exist",
      });
    }

    await AdminPermission.destroy({ where: { admin_id } });

    const adminPermissions = permission_ids.map((permission_id) => ({
      admin_id,
      permission_id,
    }));

    await AdminPermission.bulkCreate(adminPermissions, {
      ignoreDuplicates: true,
    });

    res.status(200).json({
      message: "Admin permissions updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" }, error);
  }
};

const getAllAdminPermsionbyID = async (req, res) => {
  try {
    const { admin_id } = req.params;
    if (!admin_id) {
      return res.status(400).json({
        message: "Admin ID are required",
      });
    }

    const admin = await Admin.findByPk(admin_id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const adminPermissions = await AdminPermission.findAll({
      where: { admin_id: admin_id },
      include: [
        {
          model: Permission,
          attributes: ["permission_name"],
        },
      ],
    });
    const result = adminPermissions
      .map((perm) => {
        if (perm.permission) {
          return perm.permission.permission_name;
        } else {
          console.error(
            "Permission object is missing for adminPermission:",
            perm
          );
          return null;
        }
      })
      .filter(Boolean);

    if (result.length == 0) {
      return res.status(400).json({
        message:
          "No permission found to  this Sub-admin, Please first allot some permissions",
      });
    }

    return res.status(200).json({
      message: "Permission Found",
      result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error :Error while getting permissions" });
  }
};

const deleteAdminPermission = async (req, res) => {
  try {
    const { admin_id } = req.params;
    if (!admin_id) {
      return res.status(400).json({
        message: "Admin ID are required",
      });
    }

    const admin = await Admin.findByPk(admin_id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    await AdminPermission.destroy({
      where: { admin_id: admin_id },
    });

    return res.status(200).json({
      message: "All Permission for Sub-admin deleted Sucessfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error :Error while deleting permissions" });
  }
};

const addPermissionInBulk = async (req, res) => {
  try {
    const { permission_names } = req.body;
    if (!permission_names || !Array.isArray(permission_names)) {
      return res
        .status(400)
        .json({ message: "An array of permission names is required" });
    }
    const createdPermissions = [];

    for (const permission_name of permission_names) {
      const existingPermission = await Permission.findOne({
        where: { permission_name },
      });

      if (!existingPermission) {
        const newPermission = await Permission.create({ permission_name });
        createdPermissions.push(newPermission);
      }
    }

    if (createdPermissions.length > 0) {
      res.status(201).json({
        message: "Permissions added successfully",
        permissions: createdPermissions,
      });
    } else {
      res.status(400).json({
        message:
          "No new permissions were added. All permissions already exist.",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" }, error);
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const data = await Admin.findAll();
    res.status(200).json({ sucess: true, AdminData: data });
  } catch (error) {
    res.status(500).json({ message: "Server error" }, error);
  }
};

const updateAdminApprovalStatus = async (req, res) => {
  const { user_id, status } = req.body;

  try {
    const user = await Users.findOne({ where: { user_id: user_id } });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    user.adminApprovalStatus = status;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Admin approval status updated", user });
  } catch (error) {
    return { success: false, message: "An error occurred", error };
  }
};

const getAllUserdata = async (req, res) => {
  try {
    const data = await Users.findAll();
    res.status(200).json({ sucess: true, userData: data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error, cannot get user data" }, error);
  }
};
const deleteUser = async (req, res) => {
  const { user_id } = req.body;
  try {
    const data = await Users.findByPk(user_id);
    if (!data) {
      return res.status(400).json({ messsage: "User data not found" });
    }
    data.destroy();
    res
      .status(200)
      .json({ success: true, message: "User deleted sucessfully" });
  } catch (error) {
    console.log(error);
    
    res
      .status(500)
      .json({ message: "Server error can't delete user data" }, error);
  }
};

const deleteSubadmin = async (req, res) => {
  const { admin_id } = req.body;
  try {
    const data = await Admin.findByPk(admin_id);
    if (!data) {
      return res.status(400).json({ messsage: "Admin data not found" });
    }

    if (data.is_superadmin == 1) {
      return res.status(400).json({ messsage: "Super admin can't be Deleted" });
    }

    data.destroy();
    res
      .status(200)
      .json({ success: true, message: "Admin deleted sucessfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error can't delete Admin data" }, error);
  }
};

const updateBlockedStatus = async (req, res) => {
  const { user_id, isblocked } = req.body;

  try {
    const user = await Users.findOne({ where: { user_id: user_id } });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    user.isblocked = isblocked;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "User Block status updated", user });
  } catch (error) {
    return { success: false, message: "An error occurred", error };
  }
};

const addVehicleType = async (req, res) => {
  const { vehicle_type } = req.body;

  try {
    if (!vehicle_type) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: vehicle_type is required.",
      });
    }

    const data = await VM.create({ vehicle_type });

    if (!data) {
      return res
        .status(500)
        .json({ success: false, message: "Error while adding data" });
    }

    return res.status(201).json({
      success: true,
      message: "Data added successfully",
      data,
    });
  } catch (error) {
    console.error("Error in addVehicleType:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
      error: error.message || "Unknown error",
    });
  }
};

const updateVehicleType = async (req, res) => {
  try {
    const { vm_id } = req.params;
    const { vehicle_type } = req.body;

    if (!vehicle_type) {
      return res.status(400).json({ message: "Vehicle type is required." });
    }

    const vehicle = await VM.findByPk(vm_id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle type not found." });
    }
    if (vehicle_type) {
      vehicle.vehicle_type = vehicle_type;
    }
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle type updated successfully.",
      data: vehicle,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "An error occurred", error });
  }
};

const deleteVehicleType = async (req, res) => {
  try {
    const { vm_id } = req.params;

    const vehicle = await VM.findByPk(vm_id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle type not found." });
    }

    await vehicle.destroy();

    res.status(200).json({
      success: true,
      message: "Vehicle type deleted successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "An error occurred", error });
  }
};

const getAllVehicleTypes = async (req, res) => {
  try {
    const data = await VM.findAll();

    if (!data) {
      return res.status(400).json({ message: "Error while getting data" });
    }
    res
      .status(200)
      .json({ sucess: true, message: "data fetched sucessfully", data: data });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "An error occurred", error });
  }
};

const addVehicleDetails = async (req, res) => {
  const { vm_id, vehicle_brand, vehicle_model, vehicle_varient } = req.body;
  try {
    if (!vm_id | !vehicle_brand | !vehicle_model | !vehicle_varient) {
      return res.status(203).json({ sucess: false, message: "invalid input" });
    }
    const existingtype = await VM.findByPk(vm_id);
    if (!existingtype) {
      return res.status(400).json({ message: "invalid vm_id" });
    }
    const newvehicle = await VD.create({
      vehicle_brand,
      vehicle_model,
      vehicle_varient,
      vm_id,
    });
    if (!newvehicle) {
      return res
        .status(400)
        .json({ sucess: false, message: "error while creatig new entry" });
    }
    res
      .status(200)
      .json({ sucess: true, message: "Data added sucesfully", newvehicle });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "An error occurred", error });
  }
};

const updateVehicleDetails = async (req, res) => {
  const { vehicle_id } = req.params;
  const { vm_id, vehicle_brand, vehicle_model, vehicle_varient } = req.body;

  try {
    const vehicle = await VM.findByPk(vm_id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle type not found." });
    }
    if (!vehicle_id) {
      return res
        .status(203)
        .json({ sucess: false, message: "invalid vehicle_id" });
    }
    const existingVehicleData = await VD.findByPk(vehicle_id);
    if (!existingVehicleData) {
      return res.status(404).json({ message: "Vehicle Data not found." });
    }
    if (vm_id) {
      existingVehicleData.vm_id = vm_id;
    }
    if (vehicle_brand) {
      existingVehicleData.vehicle_brand = vehicle_brand;
    }
    if (vehicle_model) {
      existingVehicleData.vehicle_model = vehicle_model;
    }
    if (vehicle_varient) {
      existingVehicleData.vehicle_varient = vehicle_varient;
    }

    await existingVehicleData.save();

    res.status(200).json({
      sucess: true,
      message: "Data Updated sucesfully",
      existingVehicleData,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "An error occurred", error });
  }
};

const getallVechileDataBytype = async (req, res) => {
  const vm_id = req.params;
  try {
    if (!vm_id) {
      return res.status(203).json({ sucess: false, message: "invalid vm_id" });
    }
    const data = await VD.findAll({
      vm_id: vm_id,
    });
    if (!data) {
      return res.status(400).json({ message: "Error while getting data" });
    }
    res
      .status(200)
      .json({ sucess: true, message: "Data fetched Sucessfully", data });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "An error occurred", error });
  }
};
const getallVechileData = async (req, res) => {
  try {
    const data = await VD.findAll();
    if (!data) {
      return res.status(400).json({ message: "Error while getting data" });
    }
    res
      .status(200)
      .json({ sucess: true, message: "Data fetched Sucessfully", data });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "An error occurred", error });
  }
};
const getVechileDataByid = async (req, res) => {
  const vehicle_id = req.params;
  try {
    if (!vehicle_id) {
      return res.status(203).json({ sucess: false, message: "invalid vm_id" });
    }
    const data = await VD.findOne({
      vehicle_id: vehicle_id,
    });
    if (!data) {
      return res.status(400).json({ message: "Error while getting data" });
    }
    res
      .status(200)
      .json({ sucess: true, message: "Data fetched Sucessfully", data });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "An error occurred", error });
  }
};
const deleteVehicleData = async (req, res) => {
  const { vehicle_id } = req.params;
  try {
    if (!vehicle_id) {
      return res
        .status(203)
        .json({ sucess: false, message: "invalid vehicle_id" });
    }

    const data = await VD.findByPk(vehicle_id);
    if (!data) {
      return res.status(400).json({ message: "Error while getting data" });
    }
    await data.destroy();
    res.status(200).json({ sucess: true, message: "Data Deleted Sucessfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "An error occurred", error });
  }
};
const addProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      tyre_brand,
      tyre_model,
      tyre_size,
      tyre_type,
      tyre_position,
      tyre_material,
      rim_size,
      stock,
      isAvailable,
      SKU,
      price,
      vehicle_ids,
    } = req.body;
    let parsedVehicleIds;
    try {
      parsedVehicleIds = JSON.parse(vehicle_ids); // Expecting JSON array: [1, 2, 3]
    } catch (err) {
      return res.status(400).json({
        message: "Invalid vehicle ID format. Must be valid JSON array.",
      });
    }
    const vehicles = await VD.findAll({
      where: { vehicle_id: parsedVehicleIds },
      attributes: ["vehicle_id"],
    });

    const existingVehicleIDS = vehicles.map((veh) => veh.vehicle_id);
    const invalidVehicleaIDS = parsedVehicleIds.filter(
      (id) => !existingVehicleIDS.includes(id) // Corrected here
    );

    if (invalidVehicleaIDS.length > 0) {
      return res.status(400).json({
        message: `Invalid Vehicle IDs: ${invalidVehicleaIDS.join(", ")}`,
      });
    }

    let images = [];
    if (req.files && req.files["images"]) {
      if (Array.isArray(req.files["images"])) {
        images = req.files["images"].map((file) =>
          path.join("images", file.filename || "")
        );
      } else {
        images.push(path.join("images", req.files["images"].filename || ""));
      }
    }

    const baseUrl = process.env.BASE_URL;
    const imagePaths = images.map(
      (image) => `${baseUrl}${image.replace(/\\/g, "/").replace("public/", "")}`
    );

    const newProduct = await Product.create({
      title,
      description,
      tyre_brand,
      tyre_model,
      tyre_size,
      tyre_type,
      tyre_position,
      tyre_material,
      rim_size,
      stock,
      isAvailable,
      SKU,
      price,
      images: imagePaths,
      vehicle_ids: parsedVehicleIds,
    });

    res.status(201).json({
      message: "Product created successfully.",
      data: newProduct,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating product." });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const {
      title,
      description,
      tyre_brand,
      tyre_model,
      tyre_size,
      tyre_type,
      tyre_position,
      tyre_material,
      rim_size,
      stock,
      isAvailable,
      SKU,
      price,
      vehicle_ids,
    } = req.body;

    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    let parsedVehicleIds = [];
    if (vehicle_ids) {
      try {
        parsedVehicleIds = JSON.parse(vehicle_ids); // Expecting JSON array: [1, 2, 3]
      } catch (err) {
        return res.status(400).json({
          message: "Invalid vehicle ID format. Must be valid JSON array.",
        });
      }

      const vehicles = await VD.findAll({
        where: { vehicle_id: parsedVehicleIds },
        attributes: ["vehicle_id"],
      });

      const existingVehicleIDs = vehicles.map((veh) => veh.vehicle_id);
      const invalidVehicleIDs = parsedVehicleIds.filter(
        (id) => !existingVehicleIDs.includes(id)
      );

      if (invalidVehicleIDs.length > 0) {
        return res.status(400).json({
          message: `Invalid Vehicle IDs: ${invalidVehicleIDs.join(", ")}`,
        });
      }
    }

    let images = product.images || [];
    if (req.files && req.files["images"]) {
      if (Array.isArray(req.files["images"])) {
        images = req.files["images"].map((file) =>
          path.join("public/images", file.filename || "")
        );
      } else {
        images.push(
          path.join("public/images", req.files["images"].filename || "")
        );
      }
    }

    const baseUrl = process.env.BASE_URL;
    const imagePaths = images.map(
      (image) => `${baseUrl}${image.replace(/\\/g, "/").replace("public/", "")}`
    );

    const updatedFields = {};

    if (title) updatedFields.title = title;
    if (description) updatedFields.description = description;
    if (tyre_brand) updatedFields.tyre_brand = tyre_brand;
    if (tyre_model) updatedFields.tyre_model = tyre_model;
    if (tyre_size) updatedFields.tyre_size = tyre_size;
    if (tyre_type) updatedFields.tyre_type = tyre_type;
    if (tyre_position) updatedFields.tyre_position = tyre_position;
    if (tyre_material) updatedFields.tyre_material = tyre_material;
    if (rim_size) updatedFields.rim_size = rim_size;
    if (stock) updatedFields.stock = stock;
    if (isAvailable) updatedFields.isAvailable = isAvailable;
    if (SKU) updatedFields.SKU = SKU;
    if (price) updatedFields.price = price;
    if (parsedVehicleIds.length) updatedFields.vehicle_ids = parsedVehicleIds;
    if (imagePaths.length) updatedFields.images = imagePaths;
    await product.update(updatedFields);

    res.status(200).json({
      message: "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating product." });
  }
};
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.status(200).json({
      message: "Products fetched successfully.",
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products.",error });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    await product.destroy();

    res.status(200).json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product." ,error});
  }
};

const getAllProductbybrand = async (req, res) => {
  try {
    const { tyre_brand } = req.query;

    if (!tyre_brand) {
      return res
        .status(400)
        .json({ error: "tyre_brand query parameter is required" });
    }

    const products = await Product.findAll({
      where: { tyre_brand },
    });

    res.status(200).json({
      message: "Products fetched successfully.",
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products." });
  }
};


const getAllProductsByVehicleId = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const vehicleIdNum = parseInt(vehicle_id);

    
    const products = await Product.findAll();

    
    const filteredProducts = products.filter((product) => 
      Array.isArray(product.vehicle_ids) && product.vehicle_ids.includes(vehicleIdNum)
    );

    if (filteredProducts.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for the given vehicle ID." });
    }

    res.status(200).json({
      message: "Products fetched successfully.",
      data: filteredProducts,
    });
  } catch (error) {
    console.error("Error fetching products by vehicle ID:", error);
    res.status(500).json({ message: "Error fetching products." });
  }
};


const getProductbyId = async (req, res) => {
  const {product_id} = req.params
  try {
    const products = await Product.findByPk(product_id);
    if (!products) {
      return res
        .status(404)
        .json({ message: "No products found for the given ID." });
    }
    res.status(200).json({
      message: "Products fetched successfully.",
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products by ID:", error);
    res.status(500).json({ message: "Error fetching products." });
  }
};
const getAllQuotes = async (req, res) => {
  try {
    const data = await Quotations.findAll();
    if (!data) {
      return res
        .status(400)
        .json({ sucess: false, message: "Error: data not found " });
    }
    res
      .status(200)
      .json({ sucess: true, message: "All data entries are:", data });
  } catch (error) {
    res.status(500).json({ message: "Error while getting all quotes" });
  }
};

const getQuotesById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Quotations.findByPk(id);
    if (!data) {
      return res
        .status(400)
        .json({ sucess: false, message: "Error: data not found " });
    }
    res.status(200).json({ sucess: true, message: " Data entries are:", data });
  } catch (error) {
    res.status(500).json({ message: "Error while getting all quotes" });
  }
};

const deleteQuotesById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Quotations.findByPk(id);
    if (!data) {
      return res
        .status(400)
        .json({ sucess: false, message: "Error: data not found " });
    }
    data.destroy();
    res
      .status(200)
      .json({ sucess: true, message: " Quotes deleted sucessfully" });
  } catch (error) {
    res.status(500).json({ message: "Error while deleting quotes" });
  }
};
const updateQuotesStatus = async (req, res) => {
  try {
    const { quotation_id, status } = req.body; //"Pending", "Viewed", "Rejected", "MailSent", "Approved"

    const existingid = await Quotations.findByPk(quotation_id);
    if (!existingid) {
      return res.staus(400).json({ sucess: false, message: "invalid id" });
    }

    if (status) {
      existingid.status = status;
    }

    await existingid.save();

    res.status(200).json({ sucess: true, message: "updated sucessfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error while updating status in quotes", error });
  }
};

const sendMailforQuotations = async (req, res) => {
  const { quotation_id, mailSubject, content } = req.body;
  try {
    const currentStatus = "MailSent";
    const quotation = await Quotations.findByPk(quotation_id);
    if (!quotation) {
      return res
        .status(400)
        .json({ sucess: false, message: "Quotation data not found" });
    }

    const email = await quotation.ContactPersonEmail;

    await sendMail2(email, mailSubject, content);

    quotation.status = currentStatus;
    await quotation.save();
    res.status(200).json({ sucess: true, message: "Mail sent sucessfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "error while sending mail",
      error,
    });
  }
};

const getAllSupport = async (req, res) => {
  try {
    const SupportData = await Support.findAll();

    if (!SupportData || SupportData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Support query found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Support queryretrieved successfully",
      SupportData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

const getSupportById = async (req, res) => {
  const { id } = req.params;

  try {
    const SupportDetails = await Support.findByPk(id);

    if (!SupportDetails) {
      return res.status(404).json({
        success: false,
        message: `No contact found with ID: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact retrieved successfully",
      SupportDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

const deleteSupportById = async (req, res) => {
  const { Support_id } = req.params;

  try {
    const deletedSupport = await Support.destroy({
      where: { support_id: Support_id },
    });

    if (!deletedSupport) {
      return res.status(404).json({
        success: false,
        message: `No Support found with ID: ${Support_id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Support with ID: ${Support_id} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

const getAllOrder = async (req, res) => {
  try {
    
    const orders = await Order.findAll();

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found " });
    }

    const { Op } = require("sequelize");

    const orderDetails = await Promise.all(
      orders.map(async (order) => {
        const productIds = JSON.parse(order.product_ids);
        const products = await Product.findAll({
          where: {
            product_id: {
              [Op.in]: productIds,
            },
          },
        });

        return {
          order,
          products,
        };
      })
    );

    res.status(200).json({ success: true, orders: orderDetails });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" ,error});
  }
};

const deleteOrder = async (req,res) => {
  const {order_id}= req.params;

  try {
        const order = await Order.findByPk(order_id) ;
        if(!order) {
          return res.status(404).json({message:"Order not found with order_id"})
        }
        await order.destroy();
        res.status(200).json({sucess:true, message:"Order deleted sucessfully"})
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" ,error});
  }
}



const changeOrderStatus = async (req,res) => {
   const {order_id,status}= req.body;
  
  try {
    if(!order_id){
      return res.status(400).json("order_id not found ")
    }
    const orderData = await Order.findByPk(order_id)
    
    if(!orderData){
      return res.status(400).json("Order data not found due to invalid order_id ")
    }
    if (status) {
      orderData.status = status;
    }
    await orderData.save()
    res.status(200).json({ success: true, message:"order status changed sucessfully" });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to cancel orders" });
  }
  
}

const searchOrderList = async (req, res) => {
  try {
    const { user_id, order_id, gstNumber, phoneNumber} = req.query;

    const searchConditions = {};

    if (user_id) {
      searchConditions.user_id = user_id;
    }
    if (gstNumber) {
      searchConditions.gstNumber = gstNumber;
    }
    if (phoneNumber) {
      searchConditions.phoneNumber = phoneNumber;
    }
    if (order_id) {
      searchConditions.order_id = order_id;
    }

    if (Object.keys(searchConditions).length === 0) {
      return res.status(400).json({ message: "No search criteria provided." });
    }

    // Search the tickets based on the constructed searchConditions
    const orders = await Order.findAll({
      where: searchConditions,
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }
    
    const orderDetails = await Promise.all(
      orders.map(async (order) => {
        const productIds = JSON.parse(order.product_ids);
        const products = await Product.findAll({
          where: {
            product_id: {
              [Op.in]: productIds,
            },
          },
        });

        return {
          order,
          products,
        };
      })
    );

    res.status(200).json({orderDetails});
  } catch (error) {
    console.error("Error searching users: data", error);
    res
      .status(500)
      .json({ message: "Server error: Unable to search users Wallet" });
  }
};



const getAllContacts = async (req, res) => {
  try {
    const contacts = await contact.findAll();

    if (!contacts || contacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No contacts found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contacts retrieved successfully",
      contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

const getContactById = async (req, res) => {
  const { id } = req.params;

  try {
    const contactDetails = await contact.findByPk(id);

    if (!contactDetails) {
      return res.status(404).json({
        success: false,
        message: `No contact found with ID: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact retrieved successfully",
      contactDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};
const deleteContactById = async (req, res) => {
  const { contact_id } = req.params;

  try {
    const deletedContact = await contact.destroy({
      where: { contact_id: contact_id },
    });

    if (!deletedContact) {
      return res.status(404).json({
        success: false,
        message: `No contact found with ID: ${contact_id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Contact with ID: ${contact_id} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};


module.exports = {
  superadminsignup,
  subadminSignup,
  adminLogin,
  adminLogout,
  adminForgetPassword,
  adminVerifyOtpAndResetPassword,
  addPermission,
  getAllPermissions,
  deletePermissionById,
  addAdminPermissions,
  updateAdminPermissions,
  getAllAdminPermsionbyID,
  deleteAdminPermission,
  addPermissionInBulk,
  getAllAdmins,
  updateAdminApprovalStatus,
  getAllUserdata,
  deleteUser,
  deleteSubadmin,
  updateBlockedStatus,
  addVehicleType,
  updateVehicleType,
  deleteVehicleType,
  getAllVehicleTypes,
  addVehicleDetails,
  updateVehicleDetails,
  getallVechileDataBytype,
  getallVechileData,
  getVechileDataByid,
  deleteVehicleData,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getAllProductsByVehicleId,
  getAllProductbybrand,
  getProductbyId,
  getAllQuotes,
  getQuotesById,
  deleteQuotesById,
  updateQuotesStatus,
  sendMailforQuotations,
  deleteSupportById,
  getSupportById,
  getAllSupport,
  getAllOrder,
  deleteOrder,
  changeOrderStatus,
  searchOrderList,
  getAllContacts,
  getContactById,
  deleteContactById,

};
