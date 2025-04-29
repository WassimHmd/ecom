const Discount = require("../models/discount");

exports.createDiscount = async (req, res) => {
  try {
    const {code, percentage} = req.body;
    const discount = new Discount({
      code,
      percentage
    })
    await discount.save()
    return res.status(200).json(discount)
  } catch (error) {
    console.log(error)
    return res.status(500).json("Error")
  }
}

exports.getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find()
    return res.status(200).json(discounts)
  } catch (error) {
    console.log(error)
    return res.status(500).json("Error")
  }
}


exports.deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await Discount.findByIdAndDelete(id);
    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }
    return res.status(200).json({ message: "Discount deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json("Error");
  }
}

