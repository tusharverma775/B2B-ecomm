
module.exports = (sequelize, DataTypes) => {
    const Cart = sequelize.define(
      'user_Cart',
      {
        CartItems_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },     
        total_price: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        }
     
      },
      {
        tableName: 'user_Cart',
      }
    );
  
    return Cart;
  };

