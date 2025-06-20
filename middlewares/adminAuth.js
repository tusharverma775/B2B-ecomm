var db = require("../models/index");

var AdminPermission = db.adminPermission;
var Permission = db.permission
var Admin = db.admin
require("dotenv").config();
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        if (
          !req.headers.authorization ||
          !req.headers.authorization.startsWith("Bearer") ||
          !req.headers.authorization.split(" ")[1]
        ) {
          return res.status(422).json({
            message: "Please provide a token",
          });
        }
    
        const token = req.headers.authorization.split(" ")[1];
    
        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
          if (err) {
            if (err.name === "TokenExpiredError") {
              return res.status(401).json({
                message: "Token has expired",
              });
            } else {
              return res.status(401).json({
                message: "Invalid token",
              });
            }
          }
    
          const admin = await Admin.findByPk(decoded.admin_id);
    
          if (!admin) {
            return res.status(401).json({
              message: "Admin not found",
            });
          }
          req.admin = admin;
    
          next();
        });
    }catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

const isSuperadmin = (req, res, next) => {
    if (req.admin && req.admin.is_superadmin) {
      return next();
    } else {
      return res.status(403).json({ message: "Access denied: Superadmin only" });
    }
  };
  
  // Check if the user has a specific permission
  // const hasPermission = (permissionName) => {
  //   return async (req, res, next) => {
  //     const adminPermissions = await getAdminPermissions(req.admin_id); // Function to get admin permissions
  //     if (adminPermissions.includes(permissionName)) {
  //       return next();
  //     } else {
  //       return res.status(403).json({ message: "Access denied: You don't have permission" });
  //     }
  //   };
  // };
const isAdminOrSuperadmin = (req, res, next) => {
  if (req.admin && (req.admin.is_superadmin || req.admin.is_admin)) {
    return next();
  } else {
    return res.status(403).json({ message: "Access denied: Admin or Superadmin only" });
  }
};

const hasPermission = (permission_name) => {
  
  return async (req, res, next) => {


    if (req.admin && (req.admin.is_superadmin || req.admin.is_admin)) {
      return next();
    } else {
    const adminPermissions = await getAdminPermissions(req.admin.admin_id); // Use updated function
    if (adminPermissions.includes(permission_name)) {
      return next();
    } else {
      return res.status(403).json({ message: "Access denied: You don't have permission" });
    }
  };}
};
const getAdminPermissions = async (adminId) => {
  const adminPermissions = await AdminPermission.findAll({
    where: { admin_id: adminId },
    include: [
      {
        model: Permission,
        attributes: ['permission_name'], // Select only the permission_name
      },
    ],
  });

  // Ensure that you access the permission object correctly
  return adminPermissions.map((perm) => {
    if (perm.permission) { 
      return perm.permission.permission_name;
    } else {
      console.error('Permission object is missing for adminPermission:', perm);
      return null;
    }
  }).filter(Boolean); 
};


  module.exports = {
    verifyToken,
    isSuperadmin,
    hasPermission,
    getAdminPermissions,
    isAdminOrSuperadmin

  };
  