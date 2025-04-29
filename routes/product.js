const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const {
  list,
  read,
  create,
  update,
  remove,
  addRating
} = require("../controllers/products");
const { purchase, bid, sell, downloadBill } = require("../controllers/purchase");
const { dynamicImageUpload } = require("../middlewares/imageUpload");

router.get("/", list);
router.get("/bill/:filename", downloadBill);
router.post("/addRating", addRating)
router.get("/:id", read);
router.post("/", dynamicImageUpload, create);
router.post("/purchase", purchase);
router.post("/bid", bid)
router.post("/sell", sell)
router.put("/:id", dynamicImageUpload, update);
router.delete("/:id", remove);

module.exports = router;
