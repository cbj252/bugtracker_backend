/*
router.get("/", projectController.getProjects);
router.get("/:project_id", projectController.getOneProject);
router.post("/create", projectController.createProject);
router.post("/:project_id", projectController.postOneProject);
router.post("/:project_id/add/:user_id", projectController.addUserToProject);
router.post(
  "/:project_id/remove/:user_id",
  projectController.removeUserFromProject
);
*/

const pool = require("../config/pool");
const { isUserInProject } = require("./helper.js");

exports.getProjects = async function (req, res) {
  const query = {
    text: `SELECT project_id, title, description 
    FROM user_project_junction 
    INNER JOIN projects on projects.id = project_id WHERE user_id = ($1)`,
    values: [res.locals.currentUser_id],
  };
  pool
    .query(query)
    .then((response) => res.json(response.rows))
    .catch((e) => res.json(e.detail));
};

exports.getOneProject = async function (req, res) {
  const query = {
    text: `SELECT title, description, user_id, username, type, profilepic 
    FROM user_project_junction 
    INNER JOIN projects on projects.id = project_id 
    INNER JOIN users on users.id = user_id WHERE project_id = ($1);`,
    values: [req.params.project_id],
  };
  pool
    .query(query)
    // All projects should have at least one member, so info about valid projects will always be found.
    .then(function (response) {
      let cilentRes = [{}];
      cilentRes[0].title = response.rows[0].title;
      cilentRes[0].description = response.rows[0].description;
      // Using array index 0 for title/description and the rest for usernames. Necessary to avoid writing over title/description.
      for (let i = 1; i < response.rows.length + 1; i++) {
        cilentRes[i] = {};
        cilentRes[i].user_id = response.rows[i - 1].user_id;
        cilentRes[i].username = response.rows[i - 1].username;
        cilentRes[i].type = response.rows[i - 1].type;
        cilentRes[i].profilepic = response.rows[i - 1].profilepic;
      }
      res.json(cilentRes);
    })
    .catch((e) => res.json("error"));
};

exports.postOneProject = async function (req, res) {
  const query = {
    text: `UPDATE projects SET title = ($1), description = ($2) WHERE id = ($3);`,
    values: [req.body.title, req.body.description, req.params.project_id],
  };
  pool
    .query(query)
    .then(function (response) {
      res.json(response);
    })
    .catch((e) => res.json(e.detail));
};

exports.createProject = async function (req, res) {
  const makeProject = {
    text: "INSERT INTO projects(title, description) VALUES ($1, $2) returning id",
    values: [req.body.title, req.body.description],
  };

  const addCurrentUserToProj = function (projectId) {
    return {
      text: "INSERT INTO user_project_junction(user_id, project_id) VALUES ($1, $2)",
      values: [res.locals.currentUser_id, projectId],
    };
  };

  pool
    .query(makeProject)
    .then((response) =>
      response.rows.length === 1
        ? pool
            .query(addCurrentUserToProj(response.rows[0].id))
            .then(() => res.json(response.rows[0].id))
            .catch((e) => res.json(e.detail))
        : response.rows.length === 0
        ? res.json(`makeProject error - Multiple Project IDs returned.`)
        : res.json(`makeProject error - No Project IDs returned.`)
    )
    .catch((e) => res.json(e.detail));
};

exports.addUserToProject = async function (req, res) {
  if (await isUserInProject(res.locals.currentUser_id, req.params.project_id)) {
    const query = {
      text: "INSERT INTO user_project_junction(user_id, project_id) VALUES ($1, $2) returning id",
      values: [req.params.user_id, req.params.project_id],
    };
    pool
      .query(query)
      .then((response) => res.json(response.rows[0].id))
      .catch((e) => res.json(e.detail));
    return true;
  } else {
    res.json("Logged in user is not part of project.");
  }
};

exports.removeUserFromProject = async function (req, res) {
  if (await isUserInProject(res.locals.currentUser_id, req.params.project_id)) {
    const query = {
      text: "DELETE FROM user_project_junction WHERE user_id = ($1) AND project_id = ($2) returning id",
      values: [req.params.user_id, req.params.project_id],
    };
    pool
      .query(query)
      .then((response) => res.json(response.rows[0].id))
      .catch((e) => res.json(e.detail));
    return true;
  } else {
    res.json("Logged in user is not part of project.");
  }
};
