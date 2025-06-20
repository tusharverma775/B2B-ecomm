const express = require('express');
require("dotenv").config();
const cors = require("cors");
require('./models/index')
require("./config/database")
const routes = require("./routes/routes")
const htaccess = require("express-htaccess-middleware");
const bodyParser = require("body-parser");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());




app.use(
  htaccess({
    file: __dirname + "/.htaccess",
  })
);

app.use(express.static("public"));



app.use('/', routes); 

const port = process.env.PORT ;


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
