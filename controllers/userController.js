/*
router.get("/info", userController.userInfo);
router.get("/users/getTickets/assigned", userController.getAssignedTickets);
router.get("/users/getTickets/assigned/excludeClosed", userController.getAssignedTicketsNoClosed);
router.get("/users/getTickets/all", userController.getAllTickets);
router.get("/users/getTickets/all/excludeClosed", userController.getAllTicketsNoClosed);
router.get("/view/:project_id", userController.usersInProject);
router.get("/viewnot/:project_id", userController.usersNotInProject);
*/

const pool = require("../config/pool");
const { isUserInProject, getUserInfo } = require("./helper.js");

exports.userInfo = async function (req, res) {
  let info = await getUserInfo(res.locals.currentUser_id);
  return res.json(info);
};

exports.getAssignedTickets = async function (req, res) {
  const query = {
    text: `SELECT tickets.id as ticket_id, projects.id as project_id, tickets.title, tickets.description, projects.title as project, 
    ticket_prio, status, tickets.type, time 
    FROM tickets
    INNER JOIN users on tickets.developer = users.id
    INNER JOIN projects on tickets.project = projects.id 
    WHERE developer = ($1);`,
    values: [res.locals.currentUser_id],
  };
  pool
    .query(query)
    .then((response) => res.json(response.rows))
    .catch((e) => res.json(e.detail));
};

exports.getAssignedTicketsExcludeClosed = async function (req, res) {
  const query = {
    text: `SELECT tickets.id as ticket_id, projects.id as project_id, tickets.title, tickets.description, projects.title as project, 
    ticket_prio, status, tickets.type, time 
    FROM tickets
    INNER JOIN users on tickets.developer = users.id
    INNER JOIN projects on tickets.project = projects.id AND status != 'Closed'
    WHERE developer = ($1);`,
    values: [res.locals.currentUser_id],
  };
  pool
    .query(query)
    .then((response) => res.json(response.rows))
    .catch((e) => res.json(e.detail));
};

exports.getAllTickets = async function (req, res) {
  const query = {
    text: `SELECT tickets.id as ticket_id, projects.id as project_id, tickets.title, tickets.description, projects.title as project, 
    ticket_prio, status, tickets.type, username, time 
    FROM user_project_junction
    INNER JOIN projects on projects.id = project_id AND user_id = ($1)
    INNER JOIN tickets on projects.id = tickets.project
    INNER JOIN users on tickets.developer = users.id;`,
    values: [res.locals.currentUser_id],
  };
  pool
    .query(query)
    .then((response) => res.json(response.rows))
    .catch((e) => res.json(e.detail));
};

exports.getAllTicketsExcludeClosed = async function (req, res) {
  const query = {
    text: `SELECT tickets.id as ticket_id, projects.id as project_id, tickets.title, tickets.description, projects.title as project, 
    ticket_prio, status, tickets.type, username, time 
    FROM user_project_junction
    INNER JOIN projects on projects.id = project_id AND user_id = ($1)
    INNER JOIN tickets on projects.id = tickets.project AND status != 'Closed'
    INNER JOIN users on tickets.developer = users.id;`,
    values: [res.locals.currentUser_id],
  };
  pool
    .query(query)
    .then((response) => res.json(response.rows))
    .catch((e) => res.json(e.detail));
};

exports.usersInProject = async function (req, res) {
  if (await isUserInProject(res.locals.currentUser_id, req.params.project_id)) {
    const query = {
      text: `SELECT user_id, username FROM user_project_junction 
      INNER JOIN users on users.id = user_id 
      WHERE project_id = ($1);`,
      values: [req.params.project_id],
    };

    return await pool
      .query(query)
      .then((response) => res.json(response.rows))
      .catch((e) => res.json(e.detail));
  } else {
    res.json("Logged in user is not part of project.");
  }
};

exports.usersNotInProject = async function (req, res) {
  if (await isUserInProject(res.locals.currentUser_id, req.params.project_id)) {
    const query = {
      text: `SELECT * FROM users 
      WHERE NOT EXISTS (SELECT 1 FROM user_project_junction WHERE user_id = users.id AND project_id = ($1));`,
      values: [req.params.project_id],
    };

    return await pool
      .query(query)
      .then((response) => res.json(response.rows))
      .catch((e) => res.json(e.detail));
  } else {
    res.json("Logged in user is not part of project.");
  }
};
