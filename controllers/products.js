const Product = require("../models/product");

const arrayify = (_) => {
  return _ ? Array.isArray(_) ? _ : [_]: [];
}

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
  const images = [...arrayify(req.body.image), ...arrayify(req.images.image.map(elem=> "http://localhost:5000" + elem.path))];

    console.log(req.body)
    console.log(images)
    const product = await Product.findByIdAndUpdate(id, {...req.body,info: JSON.parse(req.body.info),  images}, {
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
    const product = await Product.findByIdAndDelete(id);
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
