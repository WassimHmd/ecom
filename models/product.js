const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  bids : {
    type: Number,
    required: true,
    default: 0
  },
  auction: {
    type: Boolean,
    required: true,
    default: false
  },
  info: {
    type: Object,
    default: {}
  }
});

const Product = mongoose.model("product", productSchema);

module.exports = Product;
