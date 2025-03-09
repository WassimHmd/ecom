const Product = require("../models/product");
const stripe = require("stripe")(
  "sk_test_51Qz6p2JIXPaahj1jaRih1JczdYwE19Ox6CrGlnjra4O6QM6olV6r2rXcHNsMb4kWE8D92bUVusErhizktkfxkRjF005k7AEKeh"
);

exports.purchase = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).send({ message: "No products provided" });
    }

    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
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
      totalAmountInCents += Math.round(product.price * 100); // Sum prices in cents
    }

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
