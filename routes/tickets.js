var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");

var ticketController = require("../controllers/ticketController");

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

router.get("/:project_id", ticketController.getTicketsInProject);
router.get("/:project_id/:ticket_id", ticketController.getTicket);
router.get(
  "/:project_id/:ticket_id/comments",
  ticketController.getTicketComments
);
router.get(
  "/:project_id/:ticket_id/history",
  ticketController.getTicketHistory
);
router.post("/:project_id/create", ticketController.createTicket);
router.post("/:project_id/:ticket_id", ticketController.editTicket);
router.post(
  "/:project_id/:ticket_id/comment",
  ticketController.commentOnTicket
);

module.exports = router;
