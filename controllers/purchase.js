const Discount = require("../models/discount");
const Order = require("../models/order");
const Product = require("../models/product");
const stripe = require("stripe")(
  "sk_test_51Qz6p2JIXPaahj1jaRih1JczdYwE19Ox6CrGlnjra4O6QM6olV6r2rXcHNsMb4kWE8D92bUVusErhizktkfxkRjF005k7AEKeh"
);
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs').promises;

exports.purchase = async (req, res) => {
  try {
    const { productIds, discountCode } = req.body;
    console.log(discountCode)

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).send({ message: "No products provided" });
    }

    const products = await Product.find({ _id: { $in: productIds } });

    for (let product of products) {
      if (product.auction) {
        return res.status(403).json({ message: "Products for auction are not for sale" });
      }
    }

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

    // Apply discount if discountCode is provided
    let discountApplied = 0;
    if (discountCode) {
      const discount = await Discount.findOne({ code: discountCode });
      if (!discount) {
        return res.status(400).send({ message: "Invalid discount code" });
      }
      discountApplied = Math.round(totalAmountInCents * (discount.percentage / 100));
      totalAmountInCents -= discountApplied;
      // Ensure total doesn't go below 0
      totalAmountInCents = Math.max(totalAmountInCents, 0);
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

      // Generate bill
      const bill = await generateBill(productIds, discountCode);

      const order = await Order.create({
        products: products.map((p) => p._id),
        totalPrice: totalAmountInCents / 100,
        date: new Date(),
        discountCode: discountCode || null,
        discountApplied: discountApplied / 100 || 0,
      });

      res.send({
        message: "Purchase successful",
        paymentIntentId: paymentIntent.id,
        purchasedProducts: products.map((p) => ({
          id: p._id,
          name: p.name || p.title,
          price: p.price,
        })),
        discountApplied: discountApplied / 100 || 0,
        finalTotal: totalAmountInCents / 100,
        billFilename: bill.filename,
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

async function generateBill(order, discountCode = null) {
  try {
    // Validate order input
    if (!Array.isArray(order) || order.length === 0) {
      throw new Error('Invalid order: No products provided');
    }

    // Fetch products from database
    const products = await Product.find({ _id: { $in: order } });

    if (products.length !== order.length) {
      throw new Error('One or more products not found');
    }

    // Prepare bill items
    const billItems = products.map(product => ({
      name: product.name || product.title,
      quantity: 1,
      price: product.price.toFixed(2),
      total: product.price.toFixed(2)
    }));

    // Calculate subtotal
    let subtotal = billItems
      .reduce((sum, item) => sum + parseFloat(item.total), 0)
      .toFixed(2);

    // Apply discount if provided
    let discountApplied = 0;
    let totalAmount = parseFloat(subtotal);
    if (discountCode) {
      const discount = await Discount.findOne({ code: discountCode });
      if (!discount) {
        throw new Error('Invalid discount code');
      }
      discountApplied = (subtotal * (discount.percentage / 100)).toFixed(2);
      totalAmount = (subtotal - discountApplied).toFixed(2);
    }

    // Define Handlebars template
    const templateSource = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .bill-container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total, .subtotal, .discount { font-weight: bold; text-align: right; }
          .footer { text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <h1>Purchase Bill</h1>
            <p>Date: {{date}}</p>
          </div>
          
          <table>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price ($)</th>
              <th>Total ($)</th>
            </tr>
            {{#each items}}
            <tr>
              <td>{{name}}</td>
              <td>{{quantity}}</td>
              <td>{{price}}</td>
              <td>{{total}}</td>
            </tr>
            {{/each}}
          </table>

          <p class="subtotal">Subtotal: {{subtotal}}</p>
          {{#if discountApplied}}
          <p class="discount">Discount: -{{discountApplied}}</p>
          {{/if}}
          <p class="total">Total Amount: {{total}}</p>

          <div class="footer">
            <p>Thank you for your purchase!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Compile template with Handlebars
    const template = handlebars.compile(templateSource);
    const html = template({
      items: billItems,
      subtotal: subtotal,
      discountApplied: discountApplied > 0 ? discountApplied : null,
      total: totalAmount,
      date: new Date().toLocaleDateString()
    });

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set HTML content
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfPath = path.join(__dirname, `bill_${Date.now()}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    // Close browser
    await browser.close();

    // Read PDF as buffer
    const pdfBuffer = await fs.readFile(pdfPath);

    // Clean up: remove the generated PDF file
    await fs.unlink(pdfPath);

    return {
      buffer: pdfBuffer,
      filename: `bill_${Date.now()}.pdf`,
      mimeType: 'application/pdf'
    };

  } catch (error) {
    console.error('Error generating bill:', error);
    throw new Error(`Failed to generate bill: ${error.message}`);
  }
}

exports.downloadBill = async (req, res) => {
  try {
    const {filename} = req.params;
    // const filePath = path.join(__dirname, '../uploads', filename);
    res.setHeader(`Content-Disposition`, `attachment; filename="${filename}"`);
    return res.sendFile(filename, { root: "uploads" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}