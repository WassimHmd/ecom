const express = require('express');
const { createDiscount, getAllDiscounts, deleteDiscount } = require('../controllers/discount');

const router = express.Router();


router.post("/", createDiscount)
router.get("/", getAllDiscounts)
router.delete("/:id", deleteDiscount)

module.exports = router;