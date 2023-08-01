var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");

var userController = require("../controllers/userController");

router.use(function (req, res, next) {
  if (!req.headers.authorization) {
    res.json("No authentication included in Request.");
  } else {
    const givenToken = req.headers.authorization.split(" ")[1];
    jwt.verify(givenToken, "secretKey", (err, authData) => {
      if (err) {
        res.sendStatus(403, res.json("Incorrect authentication"));
      } else {
        res.locals.currentUser_id = authData.id;
        next();
      }
    });
  }
});

router.get("/info", userController.userInfo);
router.get("/getTickets/assigned", userController.getAssignedTickets);
router.get(
  "/getTickets/assigned/excludeClosed",
  userController.getAssignedTicketsExcludeClosed
);
router.get("/getTickets/all", userController.getAllTickets);
router.get(
  "/getTickets/all/excludeClosed",
  userController.getAllTicketsExcludeClosed
);
router.get("/view/:project_id", userController.usersInProject);
router.get("/viewnot/:project_id", userController.usersNotInProject);

module.exports = router;
