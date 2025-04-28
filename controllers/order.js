const Order = require("../models/order");

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("products")
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
    
  }
}