const Product = require("../models/product");

// CREATE
exports.create = async (req, res) => {
  try {

    images = req.images.image.map((image) => {
      return "http://localhost:5000" + image.path;
    })
    const product = new Product({
      ...req.body,
      info: req.body.info? JSON.parse(req.body.info): {},
      images
    });
    const result = await product.save();
    res.send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

// READ
exports.read = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).send({ message: "Product not found" });
    } else {
      res.send(product);
    }
  } catch (err) {
    console.log(err);
    res.status(404).send({ message: "Product not found" });
  }
};

// UPDATE
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!product) {
      res.status(404).send({ message: "Product not found" });
    } else {
      res.send(product);
    }
  } catch (err) {
    console.log(err);
    res.status(404).send({ message: "Product not found" });
  }
};

// DELETE
exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findByIdAndRemove(id);
    if (!product) {
      res.status(404).send({ message: "Product not found" });
    } else {
      res.send({ message: "Product deleted successfully" });
    }
  } catch (err) {
    console.log(err);
    res.status(404).send({ message: "Product not found" });
  }
};

// LIST
exports.list = async (req, res) => {
  try {
    const products = await Product.find();
    res.send(products);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};
