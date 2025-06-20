
module.exports = (sequelize,DataTypes)=>{
    const Order = sequelize.define(
        'Order',{
            order_id:{
                type:DataTypes.INTEGER,
                autoIncrement:true,
                primaryKey: true,
                allowNull:false
            },
            product_ids: {
                type: DataTypes.INTEGER,
                allowNull: false,
              },
              user_id: {
                type: DataTypes.INTEGER,
                defaultValue: false,
                references: {
                  model: "tuser",
                  key: "user_id",
              }},
              status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Received',
                values: ["Cancelled", "Delivered", "Shipped", "Processing", "Received"],
              },
              paymentStatus: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'pending',
                values: ["pending", "successful", "failed"],
              },
              typeofOrder: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'COD',
                values: ["COD", "Prepaid"],
              },
              total_price: {
                type: DataTypes.FLOAT,
                allowNull: false,
              },
              businessName: {
                type: DataTypes.STRING,
                allowNull: false,
              },
              personName: {
                type: DataTypes.STRING,
                allowNull: false,
              },
              phone: {
                type: DataTypes.BIGINT,
                allowNull: false,
              },
              email: {
                type: DataTypes.STRING,
                allowNull: false,
              },          
              gstNumber: {
                type: DataTypes.STRING,
                allowNull: false,
              },
              address: {
                type: DataTypes.STRING,
                allowNull: false,
              }, 

        },
        {
            tableName :"Order123"
        }


    )
return Order
}