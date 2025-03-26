
const Product = require("../../models/Product");
const paystack = require("../../helpers/paystack");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      cartId,
    } = req.body;

    // Create new order (pending payment)
    const newOrder = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      orderStatus: "pending",
      paymentMethod: "paystack",
      paymentStatus: "pending",
      totalAmount,
      orderDate,
      orderUpdateDate,
    });

    await newOrder.save();

    // Create Paystack payment request
    const paystackResponse = await paystack.post("/transaction/initialize", {
      email: req.body.email, // User email required by Paystack
      amount: totalAmount * 100, // Paystack expects amount in kobo (1 Naira = 100 kobo)
      currency: "GHS",
      callback_url: `http://localhost:5173/shop/paystack-return?orderId=${newOrder._id}`,
    });

    if (!paystackResponse.data.status) {
      return res.status(500).json({
        success: false,
        message: "Error while creating Paystack payment",
      });
    }

    res.status(201).json({
      success: true,
      paymentURL: paystackResponse.data.data.authorization_url,
      orderId: newOrder._id,
    });

    console.log(paystackResponse.data.data.authorization_url,)
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Some error occurred!" });
  }
};


const capturePayment = async (req, res) => {
  try {
    const { reference, orderId } = req.body;

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify payment from Paystack
    const paystackResponse = await paystack.get(`/transaction/verify/${reference}`);

    if (!paystackResponse.data.status || paystackResponse.data.data.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Update order status
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paystackResponse.data.data.id;

    // Reduce stock for each product
    for (let item of order.cartItems) {
      let product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Not enough stock for product ${item.title}`,
        });
      }

      product.totalStock -= item.quantity;
      await product.save();
    }

    // Delete cart after successful payment
    await Cart.findByIdAndDelete(order.cartId);

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Some error occurred!" });
  }
};


const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
};
