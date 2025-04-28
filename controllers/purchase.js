const Product = require("../models/product");
const stripe = require("stripe")(
  "sk_test_51Qz6p2JIXPaahj1jaRih1JczdYwE19Ox6CrGlnjra4O6QM6olV6r2rXcHNsMb4kWE8D92bUVusErhizktkfxkRjF005k7AEKeh"
);

exports.purchase = async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).send({ message: "No products provided" });
    }

    const products = await Product.find({ _id: { $in: order.map(prod=>prod.id) } });

    for(let product of products) {
      if(product.auction){
        return res.status(403).json("Products for auction are not for sale")
      }
    }

    if (products.length !== order.length) {
      return res
        .status(404)
        .send({ message: "One or more products not found" });
    }

    let totalAmountInCents = 0;
    for (const product of products) {
      if (product.quantity === 0) {
        return res
          .status(400)
          .send({ message: `${product.name || product._id} is out of stock` });
      }
      // console.log(product._id)
      // console.log("product:", order.find((elem)=> elem.id==product._id));
      totalAmountInCents += Math.round(product.price * 100*order.find((elem)=> elem.id==product._id).quantity); // Sum prices in cents
    }
    console.log("total:", totalAmountInCents);
    const testPaymentMethod = "pm_card_visa";

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountInCents,
      currency: "usd",
      payment_method: testPaymentMethod,
      confirmation_method: "manual",
      confirm: true,
      off_session: true,
    });

    if (paymentIntent.status === "succeeded") {
      for (const product of products) {
        product.quantity -= 1;
        await product.save();
      }
      res.send({
        message: "Purchase successful",
        paymentIntentId: paymentIntent.id,
        purchasedProducts: products.map((p) => ({
          id: p._id,
          name: p.name || p.title,
          price: p.price,
        })),
      });
    } else {
      res
        .status(400)
        .send({ message: "Payment failed", status: paymentIntent.status });
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: "Purchase failed", error: err.message });
  }
};

exports.bid = async (req, res) => {
  try {
    const { productId, price } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (price <= product.price) {
      return res.status(400).json({ message: "Bid price must be higher than the current price" });
    }

    product.price = price
    product.bids = product.bids + 1
    product.save()
    return res.status(200).json({ message: "Bid placed successfully" });

  } catch (error) {
    console.log(error)
    return res.status(500).json("Error")
  }
}

exports.sell = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.auction || !product.bidPlaced) {
      return res.status(400).json({ message: "Product is not for auction or no bid has been placed" });
    }

    const totalAmountInCents = Math.round(product.price * 100); // Convert price to cents
    const testPaymentMethod = "pm_card_visa";

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountInCents,
      currency: "usd",
      payment_method: testPaymentMethod,
      confirmation_method: "manual",
      confirm: true,
      off_session: true,
    });

    if (paymentIntent.status === "succeeded") {
      product.quantity -= 1;
      await product.save();

      res.send({
        message: "Product sold successfully",
        paymentIntentId: paymentIntent.id,
        soldProduct: {
          id: product._id,
          name: product.name || product.title,
          price: product.price,
        },
      });
    } else {
      res
        .status(400)
        .send({ message: "Payment failed", status: paymentIntent.status });
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: "Sale failed", error: err.message });
  }
}