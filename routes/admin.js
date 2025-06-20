const express = require('express');
const router = express.Router();
const adminControllers = require('../controllers/adminControllers');
const auth = require('../middlewares/adminAuth')
const multer = require("../helper/multer");
const upload = require('../helper/multer');


router.post('/superAdminSignup', adminControllers.superadminsignup);
router.post('/signup',auth.verifyToken,auth.isSuperadmin, adminControllers.subadminSignup);
router.post('/login', adminControllers.adminLogin);
router.put('/logout',auth.verifyToken, adminControllers.adminLogout);
router.post('/forgetPassword', adminControllers.adminForgetPassword);
router.put('/VerifyOtpAndResetPassword/:admin_id', adminControllers.adminVerifyOtpAndResetPassword)
router.post('/addPermission', auth.verifyToken,auth.isSuperadmin,adminControllers.addPermission);
router.get('/getAllPermissions', auth.verifyToken,auth.isSuperadmin,adminControllers.getAllPermissions);
router.delete('/deletePermissionById/:permission_id',adminControllers.deletePermissionById)
router.post('/addAdminPermissions', auth.verifyToken,auth.isSuperadmin,adminControllers.addAdminPermissions);
router.put('/updateAdminPermissions',auth.verifyToken,auth.isSuperadmin, adminControllers.updateAdminPermissions);
router.get('/getAllAdminPermsionbyID/:admin_id',auth.verifyToken,auth.isSuperadmin, adminControllers.getAllAdminPermsionbyID);
router.delete('/deleteAdminPermission/:admin_id', auth.verifyToken,auth.isSuperadmin,adminControllers.deleteAdminPermission);
router.post('/addPermissionInBulk', adminControllers.addPermissionInBulk);
router.get('/getAllAdmins',auth.verifyToken,auth.isSuperadmin, adminControllers.getAllAdmins);
router.post('/updateUserApprovalStatus', adminControllers.updateAdminApprovalStatus);
router.get("/getAllUserdata", adminControllers.getAllUserdata)
router.delete("/deleteUser", adminControllers.deleteUser)
router.delete("/deleteSubadmin", adminControllers.deleteSubadmin)
router.post('/updateBlockedStatus', adminControllers.updateBlockedStatus);
router.post('/addVehicleType', adminControllers.addVehicleType);
router.put('/updateVehicleType/:vm_id', adminControllers.updateVehicleType);
router.get('/getAllVehicleTypes', adminControllers.getAllVehicleTypes);
router.delete('/deleteVehicleType/:vm_id', adminControllers.deleteVehicleType);
router.post('/addVehicleDetails', adminControllers.addVehicleDetails);
router.put('/updateVehicleDetails/:vehicle_id', adminControllers.updateVehicleDetails);
router.delete('/deleteVehicleDetails/:vehicle_id', adminControllers.deleteVehicleData);
router.get('/getallVechileDetails', adminControllers.getallVechileData);
router.get('/getAllVehicleDetailsByTypes/:vm_id', adminControllers.getallVechileDataBytype);
router.get('/getVechileDetailByid/:vehicle_id', adminControllers.getVechileDataByid);
router.post('/addProduct',upload,adminControllers.addProduct);
router.put('/updateProduct/:product_id', upload,adminControllers.updateProduct);
router.delete('/deleteProduct/:product_id', adminControllers.deleteProduct);
router.get('/getAllProducts', adminControllers.getAllProducts)
router.get('/getAllProductsByVehicleId/:vehicle_id', adminControllers.getAllProductsByVehicleId);
router.get("/getAllProductbybrand", adminControllers.getAllProductbybrand);
router.get('/getProductById/:product_id', adminControllers.getProductbyId);
router.get('/getAllQuotes', adminControllers.getAllQuotes);
router.get('/getQuotesByid/:id', adminControllers.getQuotesById);
router.delete('/deleteQuotesById/:id',adminControllers.deleteQuotesById)
router.patch('/updateQuotesStatus',adminControllers.updateQuotesStatus);
router.put('/sendMailforQuotations',adminControllers.sendMailforQuotations)
router.get("/getAllSupportQuerys", adminControllers.getAllSupport);
router.get("/getSupportQuerybyId/:id", adminControllers.getSupportById);
router.delete("/deleteSupportQuery/:Support_id",adminControllers.deleteSupportById);
router.get("/getAllOrder", adminControllers.getAllOrder);
router.delete('/deleteOrder/:order_id', adminControllers.deleteOrder)
router.put('/changeOrderStatus', adminControllers.changeOrderStatus)
router.get('/searchOrderList',adminControllers.searchOrderList);
router.get("/getAllContacts", adminControllers.getAllContacts);
router.get("/getContactbyId/:id", adminControllers.getContactById);
router.delete("/deleteContact/:contact_id", adminControllers.deleteContactById);











  
module.exports = router;
