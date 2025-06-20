const express = require('express');
const router = express.Router();


const AdminRoutes = require('./admin');
const UserRoutes = require('./user');


router.use('/admin', AdminRoutes); 
router.use('/user', UserRoutes); 

router.get("/api", (req, res) => {
    res.send(" hello world");
  });
  


module.exports= router