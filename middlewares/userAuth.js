var db = require("../models/index");
var Users = db.user
require("dotenv").config();
const jwt = require('jsonwebtoken');

const isAuthorize = async(req,res,next)=>{
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
             const userID = decoded.user_id
       
             const user = await Users.findByPk(userID);
       
             if (!user) {
               return res.status(401).json({
                 message: "User not found",
               });
             }     
             req.user = user;
       
             next();
           });
       }catch (error) {
       return res.status(401).json({ message: 'Unauthorized: Invalid token' });
     }
  
}
module.exports ={
    isAuthorize
}