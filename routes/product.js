const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const {
  list,
  read,
  create,
  update,
  remove,
} = require("../controllers/products");
const { purchase } = require("../controllers/purchase");

router.get("/", list);
router.get("/:id", read);
router.post("/", create);
router.post("/purchase", purchase);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;
