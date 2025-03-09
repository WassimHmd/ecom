var express = require("express");
var router = express.Router();

/* GET home page. */
router.use("/products", require("./product"));

module.exports = router;
