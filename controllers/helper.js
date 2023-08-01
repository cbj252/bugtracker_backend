const pool = require("../config/pool");

async function getUserInfo(userId) {
  const query = {
    text: "SELECT * FROM users WHERE id = $1",
    values: [userId],
  };

  return await pool
    .query(query)
    .then((response) =>
      response.rows.length === 1
        ? response.rows[0]
        : response.rows.length === 0
        ? Error(`Function getUserInfo error - No user under ${userId} found.`)
        : Error(`Database error - Multiple users with ${userId} found.`)
    )
    .catch((e) => console.error(e.stack));
}

async function getUserProjects(userId) {
  const query = {
    text: `SELECT project_id, title, description FROM user_project_junction 
    INNER JOIN projects on projects.id = project_id WHERE user_id = ($1)`,
    values: [userId],
  };
  return await pool
    .query(query)
    .then((response) => response.rows)
    .catch((e) => console.error(e.stack));
}

async function isUserInProject(userId, projectId) {
  const query = {
    text: `SELECT project_id FROM user_project_junction 
    INNER JOIN projects on projects.id = project_id WHERE user_id = ($1) AND project_id = ($2)`,
    values: [userId, projectId],
  };
  return await pool
    .query(query)
    .then((response) =>
      response.rows.length === 1
        ? true
        : response.rows.length === 0
        ? false
        : Error(
            `Database error - ${userId} is associated with ${projectId} multiple times.`
          )
    )
    .catch((e) => console.error(e.stack));
}

async function isTicketInProject(ticketId, projectId) {
  const query = {
    text: "SELECT project FROM tickets WHERE id = ($1) AND project = ($2)",
    values: [ticketId, projectId],
  };
  return await pool
    .query(query)
    .then((response) =>
      response.rows.length === 1
        ? true
        : response.rows.length === 0
        ? false
        : Error(
            `Database error - ${ticketId} is associated with ${projectId} multiple times. This shouldn't be possible.`
          )
    )
    .catch((e) => console.error(e.stack));
}

async function idToUsername(id) {
  const query = {
    text: "SELECT username FROM users WHERE id = ($1)",
    values: [id],
  };
  return await pool
    .query(query)
    .then((response) =>
      response.rows.length === 1
        ? response.rows[0].username
        : response.rows.length === 0
        ? Error(`Id is not associated with any username.`)
        : Error(
            `Database error - ${ticketId} is associated with ${projectId} multiple times. This shouldn't be possible.`
          )
    )
    .catch((e) => console.error(e.stack));
}

module.exports = {
  getUserInfo,
  getUserProjects,
  isUserInProject,
  isTicketInProject,
  idToUsername,
};
