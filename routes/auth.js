var express = require("express");
var router = express.Router();

var authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/signup/manager", authController.signupManager);
router.post("/signup/developer", authController.signupDev);

module.exports = router;
