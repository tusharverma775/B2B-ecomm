const express = require('express');
const router = express.Router();
const  userControllers = require('../controllers/userControllers')
const {isAuthorize} = require('../middlewares/userAuth')

router.post("/signup", userControllers.signupUser);
router.put("/verifyOtp/:user_id", userControllers.verifyOtp);
router.post("/login", userControllers.loginUser);
router.put("/logout",isAuthorize, userControllers.logoutUser);
router.put('/forgetPassword', userControllers.userForgotPassword);
router.put('/VerifyOtpAndResetPassword/:user_id', userControllers.userVerifyOtpAndResetPassword);
router.put("/updateUser",isAuthorize, userControllers.updateUser);
router.post("/createContact", userControllers.addContact);
router.get("/userSearch", userControllers.user_search)
router.post("/addToCart", isAuthorize , userControllers.addToCart)
router.put("/updateCartItem", isAuthorize , userControllers.updateCartItem);
router.delete("/deleteCartItemById",isAuthorize,userControllers.deleteCartItemById)
router.get("/getcartItemByUserId", isAuthorize , userControllers.getcartItemByUserId)
router.post("/createSupportQuery",isAuthorize, userControllers.addSupport);
router.get("/filterProducts",userControllers.filterProducts)
router.post('/addQuototes',isAuthorize, userControllers.addQuototes)
router.post('/checkout', isAuthorize,userControllers.checkout)
router.get('/getAllCartItemsByUser',isAuthorize, userControllers.getAllCartItemsByUser);
router.get('/getAllOrderbyUserid',isAuthorize,userControllers.getAllOrderbyUserid)
router.put('/cancelOrderByuser/:order_id', isAuthorize, userControllers.cancelOrderByuser);
router.get('/getOrderById/:order_id',isAuthorize , userControllers.getOrderById)
router.get('/searchVendorbyPincode', userControllers.searchVendorbyPincode)


module.exports = router;