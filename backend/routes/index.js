// backend/user/index.js
const express = require('express');
const userRouter = require("./user");
const accountRouter = require("./account");
const adminRouter = require("./admin");
const userFeaturesRouter = require("./userFeatures");

const router = express.Router();

router.use("/user", userRouter);
router.use("/account", accountRouter);
router.use("/admin", adminRouter);
router.use("/me", userFeaturesRouter);

module.exports = router;