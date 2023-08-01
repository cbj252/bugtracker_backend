var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");

var projectController = require("../controllers/projectController");

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

router.get("/", projectController.getProjects);
router.get("/:project_id", projectController.getOneProject);
router.post("/create", projectController.createProject);
router.post("/:project_id", projectController.postOneProject);
router.post("/:project_id/add/:user_id", projectController.addUserToProject);
router.post(
  "/:project_id/remove/:user_id",
  projectController.removeUserFromProject
);

module.exports = router;
