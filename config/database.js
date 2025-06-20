const { Sequelize } = require('sequelize');
const path = require('path');

// const sequelize = new Sequelize({
//   dialect: 'sqlite',                        // Specify SQLite as the database dialect
//   storage: path.join(__dirname, '../database.sqlite'), // Path to the SQLite database file
//   dialectModule: require('better-sqlite3'), // Use 'better-sqlite3' as the dialect module
//   logging: false,                           // Disable SQL query logging (optional)
// });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'), // Adjust the path if needed
  logging: false, // Optional: disable logging for cleaner output
});


sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });


module.exports = sequelize;
