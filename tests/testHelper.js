const app = require("../app.js");
const request = require("supertest");
const pool = require("../config/pool");

const hashOfPassword =
  "$2b$10$0XI/wAlj7m8IeBYXF9IWee8L.pJn1wT.rfshtBc/wnNzg0hDVymRa";

async function deleteAll() {
  const query = {
    text: "TRUNCATE users, projects, history, comments, tickets, user_project_junction",
  };
  await pool.query(query).catch((e) => console.error(e.stack));
}

async function addUser(name, type) {
  const query = {
    text: "INSERT INTO users(username, password, type) VALUES ($1, $2, $3) RETURNING id",
    values: [name, hashOfPassword, type],
  };
  return await pool
    .query(query)
    .then((response) => response.rows[0].id)
    .catch((e) => console.error(e.stack));
}

async function login_test(name) {
  const login = await request(app)
    .post("/auth/login")
    .set("Origin", "http://localhost:3000")
    .send({
      username: name,
      password: "password",
    });
  if (login.body.token !== undefined) {
    return "Bearer " + login.body.token;
  } else {
    throw Error(
      `Login function did not receive a correct token. It received ${login.body.token}`
    );
  }
}

async function addProject() {
  const query = {
    text: "INSERT INTO projects(title, description) VALUES ($1, $2) returning id",
    values: ["test_title", "test_description"],
  };
  return await pool
    .query(query)
    .then((response) => response.rows[0].id)
    .catch((e) => console.error(e.stack));
}

async function addTicket(userId, projectId) {
  const query = {
    text: `INSERT INTO tickets(title, description, ticket_prio, type, status, project, developer, time) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    values: [
      "test ticket",
      "test description",
      "High",
      "Bug",
      "Incomplete",
      projectId,
      userId,
      new Date(),
    ],
  };
  return await pool
    .query(query)
    .then((response) => response.rows[0].id)
    .catch((e) => console.error(e.stack));
}

async function addUserToProject(userId, projectId) {
  const query = {
    text: "INSERT INTO user_project_junction(user_id, project_id) VALUES ($1, $2) returning id",
    values: [userId, projectId],
  };
  return await pool
    .query(query)
    .then((response) => response.rows[0].id)
    .catch((e) => console.error(e.stack));
}

function exampleTicket(userId) {
  return {
    title: "Test Ticket",
    description: "Test Description",
    ticket_prio: "High",
    status: "Incomplete",
    type: "Bug",
    developer: userId,
  };
}

module.exports = {
  deleteAll,
  addUser,
  login_test,
  addTicket,
  addProject,
  addUserToProject,
  exampleTicket,
};
