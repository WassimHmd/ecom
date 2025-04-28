var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const dotenv = require("dotenv");
dotenv.config();

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const connectDatabase = require("./config/db");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const cors = require("cors");
app.use(cors({ origin: "*" }));

app.use("/", indexRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDatabase().then(() => {
  console.log("Database connected");

  app.listen(process.env.PORT || 3000);

  console.log(`Example app listening on port ${process.env.PORT || 3000}`);
});

module.exports = app;
