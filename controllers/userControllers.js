var db = require("../models/index");
var sequelize = require("sequelize")
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var randomstring = require("randomstring");
var {sendMail} = require("../helper/sendMail");
var User = db.user;
var UserOtp = db.userOtp;
var contact = db.contact;
var Product = db.product;
var Support = db.support;
var Cart = db.cart;
var Quotations = db.quotations;
var Order = db.order;
var OrderProduct =db.orderProduct;

const { Op } = require("sequelize");
const likeOperator = Op.like;

const generateToken = (user_id) => {
  try {
    const token = jwt.sign({ user_id }, process.env.JWT_SECRET, {
      expiresIn: "72h",
    });
    return token;
  } catch (error) {
    throw new Error("Failed to generate token");
  }
};
const signupUser = async (req, res) => {
  try {
    const {
      businessName,
      personName,
      email,
      phoneNumber,
      password,
      gstNumber,
      localAddress1, localAddress2, city, state, pincode, country,
      pancardNumber
    } = req.body;

    if (
      !businessName ||
      !personName ||
      !email ||
      !password ||
      !gstNumber ||
      !pancardNumber 
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled." });
    }

    const emailOtp = randomstring.generate({ length: 6, charset: "numeric" });
    console.log(emailOtp);

    const mailSubject = "OTP for Verification email";
    const content = `<p>Your OTP for verifying for account is: ${emailOtp}</p>`;

    await sendMail(email, mailSubject, content);
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      businessName,
      personName,
      email,
      phoneNumber,
      password: hashedPassword,
      gstNumber,
      pancardNumber,
      address:`${localAddress1}, ${localAddress2 ? localAddress2 + ',' : ''} ${city}, ${state}, ${pincode}, ${country}`,
    });

    const saveotp = UserOtp.create({
      otpEmail: emailOtp,
      user_id: newUser.user_id,
    });

    if (!saveotp) {
      return res
        .status(400)
        .json({ message: "server error - otp is not saved on table" });
    }

    return res.status(201).json({
      message:
        "Kindly check Mail for otp Verification. User created successfully",
      user: {
        id: newUser.user_id,
        businessName: newUser.businessName,
        personName: newUser.personName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        gstNumber: newUser.gstNumber,
        pancardNumber: newUser.pancardNumber,
        address: newUser.address,
        isEmailVerified: newUser.isEmailVerified,
        gstVerficationStatus: newUser.gstVerficationStatus,
      },
    });
  } catch (error) {
    console.log(error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors.map((err) => err.message),
      });
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Email already exists" });
    }
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const { user_id } = req.params;
    const data = await UserOtp.findOne({ where: { user_id: user_id } });
    if (!data) {
      return res.status(400).json({ message: "invalid user id" });
    }

    if (otp != data.otpEmail) {
      return res.status(400).json({ message: "Please type valid otp" });
    } else {
      await User.update(
        {
          isEmailVerified: true,
        },
        { where: { User_id: user_id } }
      );

      data.otpEmail = null;
      data.save();

      return res.status(200).json({
        sucess: true,
        message: "otp verified sucessfully. Kindly login",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const Users = await User.findOne({ where: { email: email } });
    if (!Users) {
      return res.status(401).json({ message: "user not found" });
    }

    if (Users.isEmailVerified == false) {
      return res.status(401).json({
        message:
          "Kindly verify email first, go to register page or contact admin",
      });
    }
    if (Users.adminApprovalStatus == false) {
      return res.status(401).json({
        message: "Kindly contact Support. Account is not verified yet",
      });
    }
    if (Users.isblocked == true) {
      return res
        .status(401)
        .json({ message: "Kindly contact Support. Account is blocked" });
    }

    const matchPassword = bcrypt.compareSync(password, Users.password);
    if (!matchPassword) {
      return res
        .status(401)
        .json({ message: "Please provide correct password" });
    }

    const tokens = generateToken(Users.user_id);

    Users.token = tokens;
    Users.save();
    res.status(200).json({
      message: "Login successful",
      token: tokens,
      Users: {
        user_id: Users.user_id,
        email: Users.email,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    user.token = null;
    await user.save();

    res.status(200).json({ message: "User logged out successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const userForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const otps = randomstring.generate({ length: 6, charset: "numeric" });

    const mailSubject = "OTP for Password Reset";
    const content = `<p>Your OTP for resetting your password is: ${otps}</p>`;

    const euatotp = await UserOtp.findOne({ where: { user_id: user.user_id } });
    if (!euatotp) {
      return res
        .status(400)
        .json({ message: "unable to find user at userOtp  table" });
    }

    euatotp.otp = otps;
    await euatotp.save();

    await sendMail(email, mailSubject, content);
    res
      .status(200)
      .json({ message: "OTP sent to your email.", user_id: user.user_id });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP." });
  }
};
const userVerifyOtpAndResetPassword = async (req, res) => {
  const { otp, newPassword } = req.body;
  const { user_id } = req.params;

  if (!user_id | !otp | !newPassword) {
    return res.status(404).json({ message: "invalid input" });
  }
  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const userOtp = await UserOtp.findOne({ where: { user_id: user_id } });

    if (userOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({ password: hashedPassword });
    userOtp.otp = null;
    await userOtp.save();

    const token = generateToken(user.user_id);

    user.token = token;
    user.save();
    res.status(200).json({ message: "Password reset successful", token });
  } catch (error) {
    console.error("Error verifying OTP or resetting password:", error);
    res.status(500).json({ message: "Error resetting password." });
  }
};
const updateUser = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { personName, email, address } = req.body;

    if (req.body.gstNumber || req.body.phoneNumber || req.body.pancardNumber) {
      return res.status(400).json({
        message:
          "GST number, phone number, and PAN card number cannot be updated.",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (personName) user.personName = personName;
    if (email) user.email = email;
    if (address) user.address = address;

    await user.save();

    return res.status(200).json({
      message: "User updated successfully.",
      user: {
        id: user.user_id,
        personName: user.personName,
        businessName: user.businessName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gstNumber: user.gstNumber,
        pancardNumber: user.pancardNumber,
        address: user.address,
        isEmailVerified: user.isEmailVerified,
        gstVerficationStatus: user.gstVerficationStatus,
      },
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors.map((err) => err.message),
      });
    }
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const addContact = async (req, res) => {
  const { name, email, phoneNo, message } = req.body;

  try {
    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Name and email are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    const newContact = await contact.create({
      name,
      email,
      phoneNo,
      message,
    });

    if (!newContact) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to create contact" });
    }
    res.status(200).json({
      success: true,
      message: "Contact added successfully",
      newContact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
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

// const user_search = async (req, res) => {
//   try {
//     const searchTerm = req.query.searchTerm;
//     if (!searchTerm || searchTerm.trim() === "") {
//       return res.status(400).json({ error: "Search query is required" });
//     }
//     const resultedProduct = await Product.findAll({
//       where: {
//         [Op.or]: [
//           {
//             title: {
//               [likeOperator]: `%${searchTerm}%`,
//             },
//           },
//           {
//             tyre_brand: {
//               [likeOperator]: `%${searchTerm}%`,
//             },
//           },
//           {
//             tyre_size: {
//               [likeOperator]: `%${searchTerm}%`,
//             },
//           },
//           {
//             tyre_type: {
//               [likeOperator]: `%${searchTerm}%`,
//             },
//           },
//           {
//             rim_size: {
//               [likeOperator]: `%${searchTerm}%`,
//             },
//           },
//           {
//             tyre_material: {
//               [likeOperator]: `%${searchTerm}%`,
//             },
//           },
//           {
//             tyre_position: {
//               [likeOperator]: `%${searchTerm}%`,
//             },
//           },
//         ],
//       },
//     });

//     res.status(200).json({ success: true, data: resultedProduct });
//   } catch (error) {
//     console.error("Error while Searching products", error);
//     res.status(500).json({ message: "Error while searching for products" });
//   }
// };

const user_search = async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm;
    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }
    const keywords = searchTerm.split(" ").map((word) => word.trim());

    const searchConditions = keywords.map((keyword) => ({
      [Op.or]: [
        { title: { [Op.like]: `%${keyword}%` } },
        { tyre_brand: { [Op.like]: `%${keyword}%` } },
        { tyre_size: { [Op.like]: `%${keyword}%` } },
        { tyre_type: { [Op.like]: `%${keyword}%` } },
        { rim_size: { [Op.like]: `%${keyword}%` } },
        { tyre_material: { [Op.like]: `%${keyword}%` } },
        { tyre_position: { [Op.like]: `%${keyword}%` } },
      ],
    }));

    const resultedProduct = await Product.findAll({
      where: {
        [Op.and]: searchConditions,
      },
    });

    res.status(200).json({ success: true, data: resultedProduct });
  } catch (error) {
    console.error("Error while searching products", error);
    res.status(500).json({ message: "Error while searching for products" });
  }
};

const addSupport = async (req, res) => {
  const { name, email, phoneNo, message, invoiceNumber } = req.body;

  try {
    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Name and email are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    const newSupport = await Support.create({
      name,
      email,
      phoneNo,
      message,
      invoiceNumber,
    });

    if (!newSupport) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to create Support qury" });
    }
    res.status(200).json({
      success: true,
      message: "Support query added successfully",
      newSupport,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};


const addToCart = async (req, res) => {
  try {
    const user = req.user;

    const { product_id, quantity } = req.body;

    const existingCartItem = await Cart.findOne({
      where: { user_id: user.user_id, product_id },
    });
    if (existingCartItem) {
      return res
        .status(400)
        .json({ error: "Item already exists in the Cart." });
    }
    const products = await Product.findOne({
      where: { product_id: product_id },
    });
    if (!products) {
      return res.status(404).json({ error: "Product not found" });
    }

    const price = products.price;
    const total_price = price * quantity;

    const newCartItem = await Cart.create({
      product_id,
      user_id: user.user_id,
      quantity,
      total_price,
    });
    res.status(201).json({
      message: "Product added to cart successfully",
      cartItem: newCartItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

const getAllCartItemsByUser = async (req, res) => {
  try {
    const user = req.user;

    const cartItems = await Cart.findAll({
      where: { user_id: user.user_id },
      include: [
        {
          model: Product,
          attributes: ["title", "tyre_brand","price","SKU","images"],
        },
      ],
    });

    if (!cartItems.length) {
      return res.status(404).json({ message: "Cart is empty" });
    }

    // Calculate total price sum
    const totalCartPrice = cartItems.reduce(
      (sum, item) => sum + item.total_price,
      0
    );

    res.status(200).json({
      message: "Cart items retrieved successfully",
      cartItems,
      totalCartPrice,
    });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};


const updateCartItem = async (req, res) => {
  try {
    const { CartItems_id, quantity } = req.body;
    const user = req.user;
    const cartItem = await Cart.findOne({
      where: { CartItems_id, user_id: user.user_id },
    });
    if (!cartItem) {
      res.status(404).json({ message: "Cart Item not found" });
    }
    const products = await Product.findOne({
      where: { product_id: cartItem.product_id },
    });
    if (!products) {
      res.status(404).json({ error: "Product not found" });
    }
    const price = products.price;
    const total_price = price * quantity;
    const updatedCart = await cartItem.update({
      quantity,
      total_price,
    });
    res
      .status(200)
      .json({ message: "Cart item updated successfully", updatedCart });
  } catch (error) {
    console.error("Error updating product to cart:", error);
    res.status(500).json({ error: "Failed to update product to cart" });
  }
};

const deleteCartItemById = async (req, res) => {
  try {
    const user = req.user;

    const { CartItems_id } = req.body;

    const cartItem = await Cart.findOne({
      where: { CartItems_id, user_id: user.user_id },
    });
    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found." });
    }

    await cartItem.destroy();

    res.status(200).json({ message: "Cart item deleted successfully." });
  } catch (error) {
    console.error("Error deleting Cart item:", error);
    res.status(500).json({ message: "Error deleting Cart item." });
  }
};

const getcartItemByUserId = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const cartItems = await Cart.findAll({
      where: { user_id },
      include: [Product],
    });

    let total_price = 0;
    cartItems.forEach((cartItem) => {
      total_price += cartItem.total_price;
    });

    res.status(200).json({ data: cartItems, total_price });
  } catch (error) {
    console.error("Error getting Cart items by user ID:", error);
    res.status(500).json({ message: "Error getting Cart items by user ID." });
  }
};

const searchvendorList = async (req, res) => {
  try {
    const { user_id, gstNumber, phoneNumber, businessName } = req.query;

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
    if (businessName) {
      searchConditions.businessName = businessName;
    }

    if (Object.keys(searchConditions).length === 0) {
      return res.status(400).json({ message: "No search criteria provided." });
    }

    // Search the tickets based on the constructed searchConditions
    const data = await User.findAll({
      where: searchConditions,
    });

    if (data.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error searching users: data", error);
    res
      .status(500)
      .json({ message: "Server error: Unable to search users Wallet" });
  }
};

const filterProducts = async (req, res) => {
  try {
    const {
      tyre_brand,
      tyre_model,
      tyre_size,
      tyre_type,
      tyre_position,
      tyre_material,
      rim_size,
      minPrice,
      maxPrice,
      isAvailable,
    } = req.query;
    const whereClause = {};
    if (tyre_brand) {
      whereClause.tyre_brand = tyre_brand;
    }
    if (tyre_model) {
      whereClause.tyre_model = tyre_model;
    }
    if (tyre_size) {
      whereClause.tyre_size = tyre_size;
    }
    if (tyre_type) {
      whereClause.tyre_type = tyre_type;
    }
    if (tyre_position) {
      whereClause.tyre_position = tyre_position;
    }
    if (tyre_material) {
      whereClause.tyre_material = tyre_material;
    }
    if (rim_size) {
      whereClause.rim_size = rim_size;
    }
    if (isAvailable !== undefined) {
      whereClause.isAvailable = isAvailable === "true";
    }
    if (minPrice) {
      whereClause.price = { [Op.gte]: parseFloat(minPrice) };
    }
    if (maxPrice) {
      whereClause.price = {
        ...whereClause.price,
        [Op.lte]: parseFloat(maxPrice),
      };
    }
    // if (vehicle_id) {
    //   whereClause.vehicle_ids = {
    //     [Op.contains]: [parseInt(vehicle_id, 10)],
    //   };
    // }

    const filteredProducts = await Product.findAll({
      where: whereClause,
    });
    res.status(200).json({ success: true, data: filteredProducts });
  } catch (error) {
    console.error("Error while filtering products:", error);
    res.status(500).json({ message: "Error while filtering products" });
  }
};

const addQuototes = async (req, res) => {
  try {
    const {
      product_id,
      ContactPersonName,
      ContactPersonEmail,
      ContactPersonPhone,
      subject,
      message,
    } = req.body;

    const  Users = req.user;
    
    if (
      !ContactPersonName || 
      !ContactPersonEmail ||
      !ContactPersonPhone ||
      !subject ||
      !message
    ) {
      return res.status(400).json({ sucess: false, message: "invalid output" });
    }
    const dataentry = await Quotations.create({
      user_id:Users.user_id,
      product_id,
      ContactPersonName,
      ContactPersonEmail,
      ContactPersonPhone,
      subject,
      message,
    });
    if (!dataentry) {
      return res
        .status(400)
        .json({ message: "error while creating database entry" });
    }
    res
      .status(200)
      .json({ sucess: true, messsage: "Requested created", dataentry });
  } catch (error) {
    res.status(500).json({ message: "Error while creating quotes", error });
  }
};

const checkout = async (req, res) => {
  const { name, localAddress1, localAddress2, city, state, pincode, country,  typeofOrder } = req.body;

  if (!name || !localAddress1 || !city || !state || !pincode || !country || !typeofOrder) {
    return res.status(400).json({ error: "All required fields must be filled" });
  }
  const user = req.user

  const userId = user.user_id;

  try {
    const cartItems = await Cart.findAll({
      where: { user_id: userId },
      include: { model: Product },
    });

    if (!cartItems.length) {
      return res.status(404).json({ message: "Cart not found or is empty" });
    }

    let totalPrice = 0;
    let productIds = [];
    cartItems.forEach((item) => {
      totalPrice += item.total_price;
      productIds.push(item.product_id);
    });
    if (typeofOrder ==='Prepaid') {
      return res.status(405).json({mesaage:"Only COD is avalable right now "})
    }
// console.log(user);

    const order = await Order.create({
      user_id: userId,
      product_ids: JSON.stringify(productIds),
      status: "Received",
      paymentStatus: "pending",
      typeofOrder,
      total_price: totalPrice,
      businessName: user.businessName,
      personName: name,
      phone: user.phoneNumber,
      email: user.email,
      gstNumber:user.gstNumber,
      address: `${localAddress1}, ${localAddress2 ? localAddress2 + ',' : ''} ${city}, ${state}, ${pincode}, ${country}`,
    });
    
    // const paymentTokenResponse = await generateTransactionToken(req, res);
    // if (!paymentTokenResponse) {
    //   return res.status(500).json({ error: "Failed to generate payment URL" });
    // }

    // await TransactionHistory.create({
    //   user_id: userId,
    //   partner_id: paymentTokenResponse.partner_id,
    //   amount: totalPrice,
    //   payment_status: "Pending",
    //   system_id: paymentTokenResponse.system_id,
    //   payment_method: "imps",
    //   transaction_type: "payin",
    //   transaction_time: new Date(),
    //   order_id: order.order_id,
    // });

    await Cart.destroy({ where: { user_id: userId } });
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while processing your order" });
  }
};

const getAllOrderbyUserid = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.user_id
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
    const orders = await Order.findAll({
      where: { user_id: userId },
    });

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found for this user" });
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
const cancelOrderByuser = async (req,res) => {
   const {order_id}= req.params;
   const status = "Cancelled";
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
    res.status(200).json({ success: true, message:"order cancelled sucessfully" });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to cancel orders" });
  }
  
}



const getOrderById = async (req, res) => {
  try {
    const user = req.user;
    const userID = user.user_id;
    const {order_id} = req.params;


    const order = await Order.findOne({
      where: {
        order_id: order_id,
        user_id: userID,
      },
    });
    // const { Op } = require("sequelize");
    const productIds = JSON.parse(order.product_ids);
    const products = await Product.findAll({
      where: {
        product_id: { [Op.in]: productIds },
      },
    });

   
    const orderDetails = {
      order,
      products,
    };
    res.status(200).send({ sucess: true, order: orderDetails });
  } catch (err) {
    console.log(err);
    
    res.status(500).send({
      error: "An error occured when trying to fetch an order.",err
    });
  }
};



const searchVendorbyPincode = async (req, res) => {
  const { pincode } = req.query;

  if (!pincode) {
    return res.status(400).json({ error: "Pincode is required" });
  }

  try {
    
    const vendors = await User.findAll({
      where: {
        address: {
          [Op.like]: `%${pincode}%`, 
        },
        adminApprovalStatus: true,
      },
    });

    if (vendors.length === 0) {
      return res.status(404).json({ message: "No vendors found for this pincode" });
    }

    res.status(200).json({ vendors });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred while fetching vendors.",
      details: error.message,
    });
  }
};

module.exports = {
  signupUser,
  verifyOtp,
  loginUser,
  logoutUser,
  userForgotPassword,
  userVerifyOtpAndResetPassword,
  updateUser,
  addContact,
  user_search,
  addSupport,
  addToCart,
  updateCartItem,
  deleteCartItemById,
  getAllCartItemsByUser,
  getcartItemByUserId,
  searchvendorList,
  filterProducts,
  addQuototes,
  checkout,
  getAllOrderbyUserid,
  cancelOrderByuser,
  getOrderById,
  searchVendorbyPincode
};
