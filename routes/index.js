var express = require("express");
var router = express.Router();

/* GET home page. */
router.use("/products", require("./product"));
router.use("/auth/", require("./auth"))
router.use("/orders", require("./order"));

module.exports = router;
